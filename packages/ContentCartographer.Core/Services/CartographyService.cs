using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.Grail.ContentCartographer.Models;

namespace Umbraco.Grail.ContentCartographer.Services
{
    /// <summary>
    /// Service to build content graphs for the cartographer
    /// </summary>
    public class CartographyService
    {
        private readonly IContentService _contentService;
        private readonly IMediaService _mediaService;
        private readonly ITagService _tagService;
        private readonly IRelationService _relationService;

        public CartographyService(
            IContentService contentService,
            IMediaService mediaService,
            ITagService tagService,
            IRelationService relationService)
        {
            _contentService = contentService ?? throw new ArgumentNullException(nameof(contentService));
            _mediaService = mediaService ?? throw new ArgumentNullException(nameof(mediaService));
            _tagService = tagService ?? throw new ArgumentNullException(nameof(tagService));
            _relationService = relationService ?? throw new ArgumentNullException(nameof(relationService));
        }

        /// <summary>
        /// Build a content graph starting from a specific node, or all root content if nodeId is 0
        /// </summary>
        public async Task<ContentGraph> BuildContentGraphAsync(ContentGraphRequest request)
        {
            var nodes = new List<CartographyNode>();
            var edges = new List<CartographyEdge>();

            // If no specific node requested, get all root content
            if (request.NodeId == 0)
            {
                var rootItems = _contentService.GetRootContent();
                if (!rootItems.Any())
                    throw new InvalidOperationException("No root content found");

                // Build graph from each root item
                foreach (var root in rootItems)
                {
                    var rootNode = MapToCartographyNode(root, "content");
                    nodes.Add(rootNode);
                    await BuildGraphRecursivelyAsync(root, nodes, edges, request, 0);
                }
            }
            else
            {
                // Build graph from specific node
                var rootContent = _contentService.GetById(request.NodeId);
                if (rootContent == null)
                    throw new InvalidOperationException($"Content with id {request.NodeId} not found");

                var rootNode = MapToCartographyNode(rootContent, "content");
                nodes.Add(rootNode);
                await BuildGraphRecursivelyAsync(rootContent, nodes, edges, request, 0);
            }

            // Calculate statistics
            var stats = new GraphStatistics
            {
                NodeCount = nodes.Count,
                EdgeCount = edges.Count,
                AverageConnections = edges.Count > 0 ? (double)edges.Count / nodes.Count : 0,
                Depth = request.Depth ?? 3
            };

            return new ContentGraph
            {
                Nodes = nodes,
                Edges = edges,
                RootNode = nodes.FirstOrDefault(),
                Statistics = stats
            };
        }

        /// <summary>
        /// Analyze impact of deleting a node
        /// </summary>
        public async Task<ImpactAnalysisResult> AnalyzeImpactAsync(int nodeId, bool includeIndirect = true)
        {
            var content = _contentService.GetById(nodeId);
            if (content == null)
                throw new InvalidOperationException($"Content with id {nodeId} not found");

            var result = new ImpactAnalysisResult
            {
                NodeId = nodeId.ToString(),
                DirectlyDependent = new List<string>(),
                IndirectlyDependent = new List<string>(),
                MediaReferences = new List<string>(),
                Tags = new List<string>(),
                Backlinks = new List<string>()
            };

            // Get items that depend on this content
            var dependents = GetContentDependents(content);
            result.DirectlyDependent = dependents.Select(c => c.Id.ToString()).ToList();

            // Get media used by this content
            var mediaUsed = GetMediaUsedByContent(content);
            result.MediaReferences = mediaUsed.Select(m => m.Id.ToString()).ToList();

            // Get tags
            var tags = GetContentTags(content);
            result.Tags = tags.ToList();

            // Get backlinks
            var backlinks = GetBacklinks(content);
            result.Backlinks = backlinks.Select(c => c.Id.ToString()).ToList();

            // Calculate indirect dependencies using BFS
            if (includeIndirect)
            {
                var visited = new HashSet<int> { nodeId };
                var queue = new Queue<IContent>(dependents);

                while (queue.Count > 0)
                {
                    var current = queue.Dequeue();
                    if (visited.Add(current.Id))
                    {
                        result.IndirectlyDependent.Add(current.Id.ToString());
                        var currentDependents = GetContentDependents(current);
                        foreach (var dep in currentDependents)
                        {
                            if (!visited.Contains(dep.Id))
                                queue.Enqueue(dep);
                        }
                    }
                }
            }

            // Calculate impact score (0-1)
            var totalNodeEstimate = 50000; // Typical Umbraco installation
            result.ImpactScore = (float)Math.Min(
                (result.DirectlyDependent.Count * 1.0 +
                 result.IndirectlyDependent.Count * 0.5 +
                 result.MediaReferences.Count * 0.3 +
                 result.Backlinks.Count * 0.7) / totalNodeEstimate,
                1.0);

            return result;
        }

        private async Task BuildGraphRecursivelyAsync(
            IContent content,
            List<CartographyNode> nodes,
            List<CartographyEdge> edges,
            ContentGraphRequest request,
            int currentDepth)
        {
            if (currentDepth >= (request.Depth ?? 3))
                return;

            // Add child content
            var children = _contentService.GetPagedChildren(content.Id, 0, int.MaxValue, out var totalChildren);
            foreach (var child in children)
            {
                if (!request.IncludeUnpublished && !child.Published)
                    continue;

                var childNode = MapToCartographyNode(child, "content");
                if (!nodes.Any(n => n.Id == childNode.Id))
                {
                    nodes.Add(childNode);
                    edges.Add(new CartographyEdge
                    {
                        Source = content.Id.ToString(),
                        Target = child.Id.ToString(),
                        RelationshipType = "child_of",
                        Strength = 1.0f
                    });

                    await BuildGraphRecursivelyAsync(child, nodes, edges, request, currentDepth + 1);
                }
            }

            // Add media references if requested
            if (request.IncludeMedia)
            {
                var mediaUsed = GetMediaUsedByContent(content);
                foreach (var media in mediaUsed)
                {
                    var mediaNode = MapToCartographyNode(media, "media");
                    if (!nodes.Any(n => n.Id == mediaNode.Id))
                    {
                        nodes.Add(mediaNode);
                        edges.Add(new CartographyEdge
                        {
                            Source = content.Id.ToString(),
                            Target = media.Id.ToString(),
                            RelationshipType = "uses_media",
                            Strength = 0.7f
                        });
                    }
                }
            }

            // Add tags if requested
            if (request.IncludeTags)
            {
                var tags = GetContentTags(content);
                foreach (var tag in tags)
                {
                    // Create a virtual tag node
                    var tagNode = new CartographyNode
                    {
                        Id = $"tag_{tag}",
                        Name = tag,
                        NodeType = "tag",
                        Level = currentDepth,
                        IsPublished = true,
                        Path = tag
                    };

                    if (!nodes.Any(n => n.Id == tagNode.Id))
                    {
                        nodes.Add(tagNode);
                        edges.Add(new CartographyEdge
                        {
                            Source = content.Id.ToString(),
                            Target = tagNode.Id,
                            RelationshipType = "tagged_with",
                            Strength = 0.5f
                        });
                    }
                }
            }
        }

        private CartographyNode MapToCartographyNode(IContent content, string nodeType)
        {
            return new CartographyNode
            {
                Id = content.Id.ToString(),
                Name = content.Name,
                NodeType = nodeType,
                Level = content.Level,
                IsPublished = content.Published,
                Path = content.Path,
                CreatedDate = content.CreateDate,
                ModifiedDate = content.UpdateDate
            };
        }

        private CartographyNode MapToCartographyNode(IMedia media, string nodeType)
        {
            return new CartographyNode
            {
                Id = media.Id.ToString(),
                Name = media.Name,
                NodeType = nodeType,
                Level = media.Level,
                IsPublished = true,
                Path = media.Path,
                CreatedDate = media.CreateDate,
                ModifiedDate = media.UpdateDate
            };
        }

        private List<IContent> GetContentDependents(IContent content)
        {
            // This would query relations or analyze content for references
            // For now, return empty list - implementation depends on relation setup
            return new List<IContent>();
        }

        private List<IMedia> GetMediaUsedByContent(IContent content)
        {
            // Parsing content properties for media references is Umbraco-version specific.
            // Placeholder implementation: return empty list. Implementors should
            // inspect property editors / value types for media pickers and resolve IDs.
            return new List<IMedia>();
        }

        private List<string> GetContentTags(IContent content)
        {
            // Tag extraction depends on how tags are stored in properties for the
            // specific Umbraco installation. Return empty list as a safe default.
            return new List<string>();
        }

        private List<IContent> GetBacklinks(IContent content)
        {
            // Find content that references this content
            // This is a simplified implementation
            return new List<IContent>();
        }
    }
}
