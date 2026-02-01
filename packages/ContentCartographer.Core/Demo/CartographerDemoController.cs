using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Services;
using Umbraco.Grail.ContentCartographer.Models;
using Umbraco.Grail.ContentCartographer.Services;

namespace Umbraco.Grail.ContentCartographer.Demo
{
    [Route("api/cartographer-demo")]
    [ApiController]
    public class CartographerDemoController : ControllerBase
    {
        private readonly CartographyService _cartographyService;

        public CartographerDemoController(
            IContentService contentService,
            IMediaService mediaService,
            ITagService tagService,
            IRelationService relationService)
        {
            _cartographyService = new CartographyService(
                contentService, mediaService, tagService, relationService);
        }

        [HttpGet("homepage")]
        public async Task<IActionResult> GetHomepageGraph()
        {
            try
            {
                var graph = await _cartographyService.BuildContentGraphAsync(
                    new ContentGraphRequest
                    {
                        NodeId = 1,
                        Depth = 3,
                        IncludeMedia = true,
                        IncludeTags = true,
                        IncludeUnpublished = false
                    });

                return Ok(new
                {
                    success = true,
                    data = graph,
                    demo = true,
                    description = "Homepage content structure with 3 levels of depth"
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    error = ex.Message,
                    demo = true
                });
            }
        }

        [HttpGet("impact-demo")]
        public async Task<IActionResult> GetImpactDemo([FromQuery] int nodeId = 1)
        {
            try
            {
                var analysis = await _cartographyService.AnalyzeImpactAsync(nodeId);

                return Ok(new
                {
                    success = true,
                    data = analysis,
                    demo = true,
                    description = $"Impact analysis for node {nodeId}"
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    error = ex.Message,
                    demo = true
                });
            }
        }

        [HttpGet("stats")]
        public IActionResult GetStats()
        {
            return Ok(new
            {
                success = true,
                data = new
                {
                    package_name = "Content Cartographer",
                    version = "1.0.0",
                    description = "Interactive 3D force-directed graph visualization of Umbraco content",
                    features = new[]
                    {
                        "3D Graph Visualization",
                        "Force-Directed Physics (Rust/WASM)",
                        "Impact Analysis",
                        "Media & Tag Relationships",
                        "Export to JSON"
                    },
                    endpoints = new[]
                    {
                        "/api/cartographer/health",
                        "/api/cartographer/graph",
                        "/api/cartographer/impact",
                        "/api/cartographer-demo/homepage",
                        "/api/cartographer-demo/impact-demo",
                        "/api/cartographer-demo/stats"
                    }
                },
                timestamp = System.DateTime.UtcNow
            });
        }
    }
}
