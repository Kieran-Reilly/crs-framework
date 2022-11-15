const ids = Object.freeze({
    REQUIRE_JS: "require_js",
    MONACO_CSS: "monaco_css"
})

export class MonacoEditor extends HTMLElement {
    #editor;

    get editor() {
        return this.#editor;
    }

    async connectedCallback() {
        await loadRequireJs();
        await loadCSS(this);

        this.#editor = await initEditor(this, this.dataset.minimap, this.dataset.language || "markdown");
    }

    async disconnectedCallback() {
        await crs.call("scripts", "unload_file", { id: ids.REQUIRE_JS });
        await crs.call("styles", "unload_file", { id: ids.MONACO_CSS });

        this.#editor = this.#editor.dispose();
    }
}

customElements.define("monaco-editor", MonacoEditor);

async function loadRequireJs() {
    const id = ids.REQUIRE_JS;
    const file = import.meta.url.replace("monaco.js", "require.js");
    await crs.call("scripts", "load_file", { id, file })
}

async function loadCSS(element) {
    const id = ids.MONACO_CSS;
    const file = import.meta.url.replace("monaco.js", "package/min/vs/editor/editor.main.css");
    await crs.call("styles", "load_file", { id, file });
    await crs.call("dom", "set_styles", {
        element,
        styles: {
            display: "block"
        }
    })
}

async function initEditor(parent, showMinimap, language) {
    if (globalThis.require == null) {
        return requestAnimationFrame(() => initEditor());
    }

    const path = import.meta.url.replace("monaco.js", "package/min/vs");

    require.config({paths: {vs: path}});

    const options = {
        language: language,
        minimap: {
            enabled: showMinimap == true
        },
        parameterHints: {
            enabled: true,
            cycle: true
        }
    };

    return new Promise(resolve => {
        require(['vs/editor/editor.main'], () => {
            const editor = monaco.editor.create(parent, options);
            editor.__type = "normal";

            resolve(editor);
        });
    })
}