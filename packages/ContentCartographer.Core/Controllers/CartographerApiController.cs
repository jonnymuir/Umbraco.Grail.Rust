using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Services;
using Umbraco.Grail.ContentCartographer.Models;
using Umbraco.Grail.ContentCartographer.Services;

namespace Umbraco.Grail.ContentCartographer.Controllers
{
    [Route("api/cartographer")]
    [ApiController]
    public class CartographerApiController : ControllerBase
    {
        private readonly CartographyService _cartographyService;

        public CartographerApiController(
            IContentService contentService,
            IMediaService mediaService,
            ITagService tagService,
            IRelationService relationService)
        {
            _cartographyService = new CartographyService(
                contentService, mediaService, tagService, relationService);
        }

        [HttpPost("graph")]
        public async Task<IActionResult> GetGraph([FromBody] ContentGraphRequest request)
        {
            try
            {
                var graph = await _cartographyService.BuildContentGraphAsync(request);
                return Ok(new { success = true, data = graph });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost("impact")]
        public async Task<IActionResult> AnalyzeImpact([FromQuery] int nodeId)
        {
            try
            {
                var analysis = await _cartographyService.AnalyzeImpactAsync(nodeId);
                return Ok(new { success = true, data = analysis });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new { status = "ok", version = "1.0.0" });
        }
    }
}
