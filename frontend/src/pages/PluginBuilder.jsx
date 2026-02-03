import { useState } from 'react';

function PluginBuilder() {
    const [pluginInfo, setPluginInfo] = useState({
        name: 'MyAwesomePlugin',
        description: 'Does amazing things with AkitaLLM',
        author: 'Your Name'
    });

    const [tools, setTools] = useState([
        {
            name: 'calculate_gravity',
            description: 'Calculates gravity based on planet mass.',
            params: [
                { name: 'mass', type: 'float', description: 'Mass of the planet' },
                { name: 'radius', type: 'float', description: 'Radius of the planet' }
            ],
            returnType: 'str'
        }
    ]);

    const addTool = () => {
        setTools([...tools, {
            name: 'new_tool',
            description: 'Description of the tool',
            params: [],
            returnType: 'str'
        }]);
    };

    const updateTool = (index, field, value) => {
        const newTools = [...tools];
        newTools[index][field] = value;
        setTools(newTools);
    };

    const addParam = (toolIndex) => {
        const newTools = [...tools];
        newTools[toolIndex].params.push({ name: 'param', type: 'str', description: '' });
        setTools(newTools);
    };

    const updateParam = (toolIndex, paramIndex, field, value) => {
        const newTools = [...tools];
        newTools[toolIndex].params[paramIndex][field] = value;
        setTools(newTools);
    };

    const removeParam = (toolIndex, paramIndex) => {
        const newTools = [...tools];
        newTools[toolIndex].params.splice(paramIndex, 1);
        setTools(newTools);
    };

    // Code Generator
    const generatePythonCode = () => {
        const className = pluginInfo.name.replace(/\s+/g, '');

        let code = `from akita.core.plugins import AkitaPlugin
from typing import List, Dict, Any

class ${className}(AkitaPlugin):
    @property
    def name(self) -> str:
        return "${pluginInfo.name.toLowerCase().replace(/\s+/g, '_')}"

    @property
    def description(self) -> str:
        return "${pluginInfo.description}"

    def get_tools(self) -> List[Dict[str, Any]]:
        return [\n`;

        tools.forEach(tool => {
            const paramsDict = tool.params.map(p => `"${p.name}": "${p.type}"`).join(', ');
            code += `            {
                "name": "${tool.name}",
                "description": "${tool.description}",
                "parameters": {${paramsDict}},
                "func": self.${tool.name}_impl
            },\n`;
        });

        code += `        ]

    # Tool Implementations\n`;

        tools.forEach(tool => {
            const paramsArgs = tool.params.map(p => `${p.name}: ${p.type}`).join(', ');
            code += `    def ${tool.name}_impl(self, ${paramsArgs}) -> ${tool.returnType}:
        # TODO: Implement ${tool.name} logic
        return "Not implemented"\n\n`;
        });

        return code;
    };

    const generateTomlCode = () => {
        const entryPoint = pluginInfo.name.toLowerCase().replace(/\s+/g, '_');
        const className = pluginInfo.name.replace(/\s+/g, '');

        return `[project.entry-points."akitallm.plugins"]
${entryPoint} = "my_package.module:${className}"`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para a área de transferência!');
    };

    return (
        <div className="container">
            <h1>🧩 AkitaLLM Plugin Builder</h1>
            <p className="text-muted mb-lg">
                Crie plugins personalizados para estender a capacidade do AkitaLLM.
            </p>

            <div className="grid grid-2">
                {/* Form Column */}
                <div>
                    <div className="card mb-lg">
                        <h3>Informações Básicas</h3>
                        <div className="form-group">
                            <label className="form-label">Nome do Plugin (PascalCase)</label>
                            <input
                                className="form-input"
                                value={pluginInfo.name}
                                onChange={e => setPluginInfo({ ...pluginInfo, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Descrição</label>
                            <input
                                className="form-input"
                                value={pluginInfo.description}
                                onChange={e => setPluginInfo({ ...pluginInfo, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex-between mb-md">
                            <h3>Ferramentas (Tools)</h3>
                            <button className="btn btn-sm btn-secondary" onClick={addTool}>+ Add Tool</button>
                        </div>

                        {tools.map((tool, tIndex) => (
                            <div key={tIndex} className="p-md border rounded mb-md bg-light">
                                <div className="form-group">
                                    <label className="form-label text-small">Function Name</label>
                                    <input
                                        className="form-input"
                                        value={tool.name}
                                        onChange={e => updateTool(tIndex, 'name', e.target.value)}
                                        placeholder="calculate_gravity"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-small">Description</label>
                                    <input
                                        className="form-input"
                                        value={tool.description}
                                        onChange={e => updateTool(tIndex, 'description', e.target.value)}
                                    />
                                </div>

                                <label className="form-label text-small mt-sm">Parameters:</label>
                                {tool.params.map((param, pIndex) => (
                                    <div key={pIndex} className="flex gap-sm mb-sm">
                                        <input
                                            className="form-input"
                                            placeholder="Name"
                                            value={param.name}
                                            onChange={e => updateParam(tIndex, pIndex, 'name', e.target.value)}
                                        />
                                        <select
                                            className="form-input"
                                            value={param.type}
                                            onChange={e => updateParam(tIndex, pIndex, 'type', e.target.value)}
                                            style={{ width: '80px' }}
                                        >
                                            <option value="str">str</option>
                                            <option value="int">int</option>
                                            <option value="float">float</option>
                                            <option value="bool">bool</option>
                                        </select>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => removeParam(tIndex, pIndex)}
                                        >
                                            x
                                        </button>
                                    </div>
                                ))}
                                <button className="btn btn-xs btn-secondary" onClick={() => addParam(tIndex)}>+ Add Param</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview Column */}
                <div>
                    <div className="card sticky-top" style={{ top: '20px' }}>
                        <div className="flex-between mb-sm">
                            <h3>📜 plugin.py</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => copyToClipboard(generatePythonCode())}>
                                Copiar
                            </button>
                        </div>
                        <pre className="code-block" style={{ maxHeight: '400px', overflow: 'auto', fontSize: '12px' }}>
                            {generatePythonCode()}
                        </pre>

                        <div className="flex-between mb-sm mt-lg">
                            <h3>📦 pyproject.toml</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => copyToClipboard(generateTomlCode())}>
                                Copiar
                            </button>
                        </div>
                        <pre className="code-block">
                            {generateTomlCode()}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PluginBuilder;
