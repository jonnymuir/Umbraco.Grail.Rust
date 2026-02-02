using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Grail.ContentCartographer.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Umbraco.Grail.ContentCartographer
{
    /// <summary>
    /// Composer to register Content Cartographer services
    /// </summary>
    public class CartographerComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            // Get logger to trace execution
            var serviceProvider = builder.Services.BuildServiceProvider();
            var loggerFactory = serviceProvider.GetService<ILoggerFactory>();
            var logger = loggerFactory?.CreateLogger<CartographerComposer>();

            logger?.LogInformation("🎯 CartographerComposer.Compose() called");

            // Register CartographyService for dependency injection
            builder.Services.AddScoped<CartographyService>();
            logger?.LogInformation("✅ CartographyService registered");

            // Add memory cache for graph caching
            builder.Services.AddMemoryCache();
            logger?.LogInformation("✅ MemoryCache registered");

            logger?.LogInformation("🎉 CartographerComposer initialized");
        }
    }
}


