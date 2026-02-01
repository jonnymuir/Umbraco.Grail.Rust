using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Grail.ContentCartographer.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Umbraco.Grail.ContentCartographer
{
    /// <summary>
    /// Composer to register Content Cartographer services
    /// </summary>
    public class CartographerComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            // Register CartographyService
            builder.Services.AddScoped<CartographyService>();

            // Optional: Add memory cache for graph caching
            builder.Services.AddMemoryCache();
        }
    }
}
