using Newtonsoft.Json;
using System.Collections.Generic;
using Umbraco.Cms.Core.Models;

namespace Umbraco.Grail.ContentCartographer.Models
{
    /// <summary>
    /// Represents a node in the content graph
    /// </summary>
    public class CartographyNode
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("node_type")]
        public string NodeType { get; set; } // "content", "media", "tag", etc.

        [JsonProperty("level")]
        public int Level { get; set; }

        [JsonProperty("is_published")]
        public bool IsPublished { get; set; }

        [JsonProperty("path")]
        public string Path { get; set; }

        [JsonProperty("created_date")]
        public System.DateTime CreatedDate { get; set; }

        [JsonProperty("modified_date")]
        public System.DateTime ModifiedDate { get; set; }
    }

    /// <summary>
    /// Represents a relationship between nodes
    /// </summary>
    public class CartographyEdge
    {
        [JsonProperty("source")]
        public string Source { get; set; }

        [JsonProperty("target")]
        public string Target { get; set; }

        [JsonProperty("relationship_type")]
        public string RelationshipType { get; set; } // "depends_on", "uses_media", "tagged_with", "references"

        [JsonProperty("strength")]
        public float Strength { get; set; }
    }

    /// <summary>
    /// Full graph representation
    /// </summary>
    public class ContentGraph
    {
        [JsonProperty("nodes")]
        public List<CartographyNode> Nodes { get; set; }

        [JsonProperty("edges")]
        public List<CartographyEdge> Edges { get; set; }

        [JsonProperty("root_node")]
        public CartographyNode RootNode { get; set; }

        [JsonProperty("stats")]
        public GraphStatistics Statistics { get; set; }
    }

    /// <summary>
    /// Graph statistics
    /// </summary>
    public class GraphStatistics
    {
        [JsonProperty("node_count")]
        public int NodeCount { get; set; }

        [JsonProperty("edge_count")]
        public int EdgeCount { get; set; }

        [JsonProperty("average_connections")]
        public double AverageConnections { get; set; }

        [JsonProperty("depth")]
        public int Depth { get; set; }
    }

    /// <summary>
    /// Impact analysis result
    /// </summary>
    public class ImpactAnalysisResult
    {
        [JsonProperty("node_id")]
        public string NodeId { get; set; }

        [JsonProperty("directly_dependent")]
        public List<string> DirectlyDependent { get; set; }

        [JsonProperty("indirectly_dependent")]
        public List<string> IndirectlyDependent { get; set; }

        [JsonProperty("media_references")]
        public List<string> MediaReferences { get; set; }

        [JsonProperty("tags")]
        public List<string> Tags { get; set; }

        [JsonProperty("backlinks")]
        public List<string> Backlinks { get; set; }

        [JsonProperty("impact_score")]
        public float ImpactScore { get; set; }
    }

    /// <summary>
    /// Request to build a content graph
    /// </summary>
    public class ContentGraphRequest
    {
        [JsonProperty("node_id")]
        public int NodeId { get; set; }

        [JsonProperty("depth")]
        public int? Depth { get; set; } = 3;

        [JsonProperty("include_media")]
        public bool IncludeMedia { get; set; } = true;

        [JsonProperty("include_tags")]
        public bool IncludeTags { get; set; } = true;

        [JsonProperty("include_unpublished")]
        public bool IncludeUnpublished { get; set; } = false;
    }
}
