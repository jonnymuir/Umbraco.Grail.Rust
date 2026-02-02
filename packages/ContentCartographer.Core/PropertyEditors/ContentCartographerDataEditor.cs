using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;

namespace Umbraco.Grail.ContentCartographer.PropertyEditors
{
    /// <summary>
    /// Backend registration for Content Cartographer property editor
    /// </summary>
    [DataEditor("Umbraco.ContentCartographer")]
    public class ContentCartographerDataEditor : DataEditor
    {
        private readonly IIOHelper _ioHelper;

        public ContentCartographerDataEditor(
            IDataValueEditorFactory dataValueEditorFactory,
            IIOHelper ioHelper)
            : base(dataValueEditorFactory)
        {
            _ioHelper = ioHelper;
        }

        protected override IConfigurationEditor CreateConfigurationEditor()
        {
            return new ContentCartographerConfigurationEditor(_ioHelper);
        }
    }

    /// <summary>
    /// Configuration editor for property editor settings
    /// </summary>
    public class ContentCartographerConfigurationEditor : ConfigurationEditor
    {
        public ContentCartographerConfigurationEditor(IIOHelper ioHelper) : base()
        {
            // Configuration fields will be added here in future versions
        }
    }
}
