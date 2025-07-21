import React, { useState, useEffect } from 'react';
import { 
  Brain, Code, Book, Play, Download, Github, Package, 
  Zap, Eye, Volume2, Hand, MessageSquare, Sparkles,
  ChevronRight, Copy, Check, ExternalLink, Terminal,
  Settings, Users, FileCode, Boxes, BookOpen, Beaker
} from 'lucide-react';

const NeuroAdaptLaunchpad = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCode, setCopiedCode] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('sensory');
  const [apiKey, setApiKey] = useState('');
  const [demoActive, setDemoActive] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');
  const [adaptedResponse, setAdaptedResponse] = useState('');

  // Code examples
  const codeExamples = {
    quickStart: `// Install NeuroAdapt SDK
npm install neuroadapt-sdk

// Basic Usage Example
// Initialize the NeuroAdapt core
const neuro = new NeuroAdapt();
await neuro.initialize();

// Create a Claude adapter with neurodiversity features
const claude = new ClaudeAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-opus-20240229'
});

// Apply user preferences automatically
const response = await claude.complete({
  prompt: "Explain machine learning",
  adaptations: neuro.getUserPreferences()
});`,

    sensoryManagement: `// Sensory Management Module Example

// Initialize sensory preferences
const sensory = new SensoryManager({
  visual: {
    brightness: 0.7,
    contrast: 1.2,
    motionTolerance: 'minimal',
    colorBlindMode: 'deuteranopia'
  },
  auditory: {
    volumePreference: 0.6,
    suddenSoundSensitivity: true,
    frequencyFilters: [
      { min: 2000, max: 4000, reduction: 0.5 }
    ]
  }
});

// Apply to VR environment
sensory.applyToEnvironment(vrScene);

// Real-time monitoring
sensory.on('overload-risk', (data) => {
  console.log('Sensory overload risk detected:', data);
  sensory.reduceStimulation();
});`,

    claudeIntegration: `// Claude API Integration with NeuroAdapt

// Initialize Claude with accessibility features
const claude = new ClaudeAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-opus-20240229'
});

// Wrap with predictable behaviors
const ai = new PredictableAI(claude);

// Configure for neurodiversity
ai.configure({
  // Consistent, calm interactions
  emotionalTone: 'supportive',
  
  // Multi-level explanations
  explanationLevels: ['simple', 'detailed', 'technical'],
  defaultLevel: 'simple',
  
  // Reduce anxiety
  previewMode: true,
  undoSteps: 10,
  
  // ADHD-friendly features
  breakReminders: true,
  chunkSize: 'small'
});

// Example: Adaptive tutoring
const response = await ai.explain({
  topic: "quantum entanglement",
  userProfile: {
    cognitiveLoad: 'moderate',
    preferredLearning: 'visual',
    attentionSpan: 'variable'
  }
});

// Response automatically adapted for user needs
console.log(response.mainExplanation);
console.log(response.visualAids);
console.log(response.interactiveExamples);`,

    vrAccessibility: `// VR/AR Accessibility Module Example

// Create personalized VR space
const comfort = new VRComfortZone({
  personalSpace: {
    radius: 2.0, // meters
    warningDistance: 3.0,
    visualIndicator: 'subtle-glow'
  },
  
  safeSpace: {
    triggers: ['double-tap', 'voice:escape'],
    environment: 'calming-nature',
    instantTransition: true
  },
  
  motion: {
    locomotion: 'teleport',
    comfortVignette: true,
    snapRotation: 45 // degrees
  }
});

// Apply to Unity scene
UnityEngine.SendMessage('NeuroAdaptBridge', 
  'ApplyComfortSettings', 
  JSON.stringify(comfort.serialize())
);`,

    quantumSimplifier: `// Quantum Computing Simplifier Example

const qv = new QuantumVisualizer({
  complexity: 'progressive',
  representations: ['visual', 'auditory', 'haptic']
});

// Create accessible quantum circuit
const circuit = qv.createCircuit();

// Add gates with explanations
circuit.addGate('H', 0, {
  explanation: {
    simple: "Flips a coin in quantum space",
    detailed: "Creates equal probability of 0 and 1",
    technical: "Applies Hadamard transformation"
  },
  visualization: 'animated-sphere',
  sound: 'harmonic-transition'
});

// Real-time feedback
circuit.on('gate-added', (gate) => {
  qv.explainLastAction(gate, userProfile.explanationLevel);
});`,

    customModel: `// DeepSeek R1 32B Integration Example

const model = new OllamaAdapter({
  model: 'deepseek-r1:32b',
  endpoint: 'http://localhost:11434',
  
  systemPrompt: \`You are NeuroAdapt, an AI assistant 
optimized for accessibility and inclusive communication.

Your responses must:
- Use calm, supportive language
- Break complex ideas into simple steps
- Offer optional detail levels
- Respect cognitive pacing
- Use visual metaphors for abstract concepts\`
});

// Apply neurodiversity adaptations
const adapted = await model.chat({
  message: "How do neural networks learn?",
  adaptations: {
    explanationDepth: 'beginner',
    useAnalogies: true,
    breakIntoSteps: true,
    highlightKeyTerms: true
  }
});`
  };

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Simulate Claude API adaptation (demo only)
  const simulateClaudeAdaptation = async (message, preferences) => {
    setAdaptedResponse('Processing...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo response based on preferences
    let response = '';
    
    if (preferences.explanationLevel === 'simple') {
      response = `Here's a simple explanation:

Machine learning is like teaching a computer to recognize patterns, similar to how you learned to recognize letters when learning to read.

The computer looks at many examples and gradually gets better at understanding what it sees.

Would you like me to explain more about how this works?`;
    } else if (preferences.explanationLevel === 'detailed') {
      response = `Machine learning is a method of teaching computers to learn from data:

1. **Training Phase**: The computer examines many examples
   - Like showing a child many pictures of cats and dogs
   - The computer notices patterns in the data

2. **Learning Process**: The computer adjusts its understanding
   - It makes guesses and checks if they're correct
   - Each mistake helps it improve

3. **Testing Phase**: We check how well it learned
   - Show it new examples it hasn't seen
   - Measure how often it gets the right answer

Key components include:
- Data (examples to learn from)
- Algorithm (the learning method)
- Model (what the computer learned)

Would you like me to dive deeper into any of these aspects?`;
    }
    
    if (preferences.useVisualMetaphors) {
      response += `\n\n🎨 Visual Metaphor: Think of it like a sculptor gradually shaping clay - each adjustment brings the final form closer to the desired outcome.`;
    }
    
    if (preferences.breakReminders) {
      response += `\n\n💭 This is a good place to pause if you need a moment to process this information.`;
    }
    
    setAdaptedResponse(response);
  };

  const components = [
    {
      id: 'sensory',
      name: 'Sensory Management',
      icon: <Eye className="w-5 h-5" />,
      description: 'Manage visual, auditory, and haptic preferences',
      status: 'stable'
    },
    {
      id: 'cognitive',
      name: 'Cognitive Load Manager',
      icon: <Brain className="w-5 h-5" />,
      description: 'Monitor and adapt to cognitive capacity',
      status: 'stable'
    },
    {
      id: 'ai',
      name: 'AI Adapters',
      icon: <MessageSquare className="w-5 h-5" />,
      description: 'Claude & LLM integration with predictable behaviors',
      status: 'stable'
    },
    {
      id: 'vr',
      name: 'VR/AR Accessibility',
      icon: <Boxes className="w-5 h-5" />,
      description: 'Comfort zones and motion management',
      status: 'beta'
    },
    {
      id: 'quantum',
      name: 'Quantum Simplifier',
      icon: <Sparkles className="w-5 h-5" />,
      description: 'Multi-sensory quantum computing interfaces',
      status: 'alpha'
    }
  ];

  const StatusBadge = ({ status }) => {
    const colors = {
      stable: 'bg-green-100 text-green-800',
      beta: 'bg-yellow-100 text-yellow-800',
      alpha: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    );
  };

  const LiveDemo = () => {
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [textSize, setTextSize] = useState(16);
    const [explanationLevel, setExplanationLevel] = useState('simple');
    const [visualMetaphors, setVisualMetaphors] = useState(true);
    const [breakReminders, setBreakReminders] = useState(false);
    
    return (
      <div className="space-y-6">
        {/* Sensory Demo */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-green-600" />
            Live Sensory Adjustment Demo
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Brightness: {brightness}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Contrast: {contrast}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Text Size: {textSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={textSize}
                  onChange={(e) => setTextSize(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <div 
              className="bg-white rounded-lg p-6 border-2 border-gray-200"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                fontSize: `${textSize}px`
              }}
            >
              <h4 className="font-semibold mb-2">Sample Content</h4>
              <p className="text-gray-700 mb-4">
                This text automatically adjusts based on your sensory preferences. 
                The NeuroAdapt SDK applies these settings across your entire application.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Interactive Button
              </button>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Code:</strong> <code className="bg-blue-100 px-2 py-1 rounded">
                sensory.setPreferences({`{ brightness: ${brightness/100}, contrast: ${contrast/100} }`})
              </code>
            </p>
          </div>
        </div>

        {/* AI Adaptation Demo */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            AI Response Adaptation Demo
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Explanation Level
                </label>
                <select 
                  value={explanationLevel}
                  onChange={(e) => setExplanationLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="simple">Simple</option>
                  <option value="detailed">Detailed</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visualMetaphors}
                    onChange={(e) => setVisualMetaphors(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Use Visual Metaphors</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={breakReminders}
                    onChange={(e) => setBreakReminders(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Include Break Reminders</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Test Message
                </label>
                <input
                  type="text"
                  value={demoMessage}
                  onChange={(e) => setDemoMessage(e.target.value)}
                  placeholder="What is machine learning?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <button
                onClick={() => simulateClaudeAdaptation(demoMessage || "What is machine learning?", {
                  explanationLevel,
                  useVisualMetaphors: visualMetaphors,
                  breakReminders
                })}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Generate Adapted Response
              </button>
            </div>
            
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
              <h4 className="font-semibold mb-2">Adapted AI Response</h4>
              <div className="text-gray-700 whitespace-pre-wrap">
                {adaptedResponse || 'Click "Generate Adapted Response" to see how the SDK adapts AI responses based on user preferences.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NeuroAdapt SDK</h1>
                <p className="text-sm text-gray-600">Launch Pad for Developers</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="https://github.com/neuroadapt/sdk" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                <Github className="w-5 h-5" />
                GitHub
              </a>
              <a href="#" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                <Book className="w-5 h-5" />
                Docs
              </a>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Install SDK
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Build Accessible AI, VR & Quantum Apps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The NeuroAdapt SDK makes it simple to create inclusive experiences for neurodivergent users 
              across emerging technologies.
            </p>
          </div>

          {/* Quick Start */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Quick Start
              </h3>
              <button
                onClick={() => copyToClipboard('npm install neuroadapt-sdk', 'quickstart')}
                className="text-gray-400 hover:text-white"
              >
                {copiedCode === 'quickstart' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <pre className="text-green-400 font-mono text-sm overflow-x-auto">
              <code>npm install neuroadapt-sdk</code>
            </pre>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {['overview', 'components', 'examples', 'playground'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Plug & Play</h3>
                    <p className="text-gray-600">
                      Single-line initialization with automatic preference detection
                    </p>
                  </div>
                  
                  <div className="text-center p-6 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">AI-Powered</h3>
                    <p className="text-gray-600">
                      Claude & LLM integration with predictable, calm interactions
                    </p>
                  </div>
                  
                  <div className="text-center p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Community-Driven</h3>
                    <p className="text-gray-600">
                      Built with and for the neurodivergent community
                    </p>
                  </div>
                </div>

                <div className="border-t pt-8">
                  <h3 className="text-2xl font-bold mb-4">Why NeuroAdapt?</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">For Developers</h4>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>TypeScript-first with comprehensive types</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Framework agnostic - works everywhere</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Extensive documentation and examples</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Built-in testing and validation tools</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">For Users</h4>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>Reduces sensory overload automatically</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>Adapts to cognitive capacity in real-time</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>Provides multiple interaction methods</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>Respects privacy with local preferences</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Components Tab */}
            {activeTab === 'components' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">SDK Components</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {components.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => setSelectedComponent(component.id)}
                      className={`p-6 rounded-lg border-2 text-left transition-all ${
                        selectedComponent === component.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg ${
                          selectedComponent === component.id ? 'bg-blue-600 text-white' : 'bg-gray-100'
                        }`}>
                          {component.icon}
                        </div>
                        <StatusBadge status={component.status} />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{component.name}</h4>
                      <p className="text-gray-600 text-sm">{component.description}</p>
                    </button>
                  ))}
                </div>

                {selectedComponent && (
                  <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-lg mb-4">
                      Installation & Usage
                    </h4>
                    <div className="bg-gray-900 rounded-lg p-4 mb-4">
                      <code className="text-green-400 font-mono text-sm">
                        npm install neuroadapt-{selectedComponent}
                      </code>
                    </div>
                    <p className="text-gray-600">
                      View full documentation for the {selectedComponent} component in our 
                      <a href="#" className="text-blue-600 hover:underline ml-1">
                        API Reference
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Examples Tab */}
            {activeTab === 'examples' && (
              <div className="space-y-8">
                <h3 className="text-2xl font-bold mb-6">Code Examples</h3>
                
                {/* Claude Integration Example */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      Claude API Integration
                    </h4>
                    <button
                      onClick={() => copyToClipboard(codeExamples.claudeIntegration, 'claude')}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {copiedCode === 'claude' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto bg-gray-900 text-gray-300">
                    <code className="text-sm font-mono">{codeExamples.claudeIntegration}</code>
                  </pre>
                </div>

                {/* Sensory Management Example */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Eye className="w-5 h-5 text-green-600" />
                      Sensory Management
                    </h4>
                    <button
                      onClick={() => copyToClipboard(codeExamples.sensoryManagement, 'sensory')}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {copiedCode === 'sensory' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto bg-gray-900 text-gray-300">
                    <code className="text-sm font-mono">{codeExamples.sensoryManagement}</code>
                  </pre>
                </div>

                {/* Custom Model Example */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Custom Model (DeepSeek R1)
                    </h4>
                    <button
                      onClick={() => copyToClipboard(codeExamples.customModel, 'custom')}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {copiedCode === 'custom' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto bg-gray-900 text-gray-300">
                    <code className="text-sm font-mono">{codeExamples.customModel}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Playground Tab */}
            {activeTab === 'playground' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Interactive Playground</h3>
                  <button
                    onClick={() => setDemoActive(!demoActive)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      demoActive
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {demoActive ? 'Demo Active' : 'Start Demo'}
                  </button>
                </div>

                {demoActive && <LiveDemo />}

                {!demoActive && (
                  <div className="text-center py-12 text-gray-600">
                    <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg">Click "Start Demo" to explore interactive examples</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resources Section */}
          <div className="mt-12 grid md:grid-cols-4 gap-6">
            <a href="#" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <FileCode className="w-8 h-8 text-blue-600 mb-3" />
              <h4 className="font-semibold mb-1">API Reference</h4>
              <p className="text-sm text-gray-600">Complete TypeScript API documentation</p>
            </a>
            
            <a href="#" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <BookOpen className="w-8 h-8 text-green-600 mb-3" />
              <h4 className="font-semibold mb-1">Tutorials</h4>
              <p className="text-sm text-gray-600">Step-by-step guides and examples</p>
            </a>
            
            <a href="#" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Users className="w-8 h-8 text-purple-600 mb-3" />
              <h4 className="font-semibold mb-1">Community</h4>
              <p className="text-sm text-gray-600">Join our Discord and forums</p>
            </a>
            
            <a href="#" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Beaker className="w-8 h-8 text-orange-600 mb-3" />
              <h4 className="font-semibold mb-1">Research</h4>
              <p className="text-sm text-gray-600">Academic papers and case studies</p>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">NeuroAdapt</span>
              </div>
              <p className="text-sm">
                Building inclusive technology for all minds.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API Reference</a></li>
                <li><a href="#" className="hover:text-white">Examples</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Community</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">GitHub</a></li>
                <li><a href="#" className="hover:text-white">Discord</a></li>
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">Contributing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">MIT License</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Code of Conduct</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 NeuroAdapt SDK. Open source under MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NeuroAdaptLaunchpad;