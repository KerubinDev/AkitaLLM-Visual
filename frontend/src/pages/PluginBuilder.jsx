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

    const [generatedCode, setGeneratedCode] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Code Generator calling the Backend Proxy
    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('http://localhost:8000/plugins/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: pluginInfo.name,
                    description: pluginInfo.description,
                    tools: tools.map(t => ({
                        name: t.name,
                        description: t.description,
                        parameters: {
                            type: 'object',
                            properties: t.params.reduce((acc, p) => {
                                acc[p.name] = { type: p.type, description: p.description };
                                return acc;
                            }, {}),
                            required: t.params.map(p => p.name)
                        }
                    }))
                })
            });
            const data = await response.json();
            setGeneratedCode(data.template);
        } catch (error) {
            console.error('Error generating plugin:', error);
            alert('Falha ao gerar o plugin via Akita Core.');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateTomlCode = () => {
        const entryPoint = pluginInfo.name.toLowerCase().replace(/\s+/g, '_');
        const className = pluginInfo.name.replace(/\s+/g, '');

        return `[project.entry-points."akitallm.plugins"]
${entryPoint} = "my_package.module:${className}"`;
    };

    const copyToClipboard = (text) => {
        if (!text) return;
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
                            <div className="flex gap-sm">
                                <button
                                    className={`btn btn-sm ${isGenerating ? 'btn-disabled' : 'btn-secondary'}`}
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? 'Gerando...' : 'Gerar Código no Core'}
                                </button>
                                <button className="btn btn-sm btn-primary" onClick={() => copyToClipboard(generatedCode)}>
                                    Copiar
                                </button>
                            </div>
                        </div>
                        <pre className="code-block" style={{ maxHeight: '400px', overflow: 'auto', fontSize: '12px' }}>
                            {generatedCode || '# Clique em "Gerar Código no Core" para visualizar o template oficial.'}
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
