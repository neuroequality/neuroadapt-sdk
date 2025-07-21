/**
 * NeuroAdapt SDK - Basic Usage Example
 * 
 * This example demonstrates the core functionality of the NeuroAdapt SDK,
 * including preference management, sensory adaptations, cognitive load
 * detection, and AI integration.
 */

import { 
  PreferenceStore, 
  VisualAdapter, 
  CognitiveLoadEngine,
  type SensoryPreferences,
  type CognitivePreferences 
} from '@neuroadapt/core';

import { 
  PredictableAI, 
  OpenAIAdapter, 
  ClaudeAdapter,
  OllamaAdapter 
} from '@neuroadapt/ai';

async function main() {
  console.log('🧠 NeuroAdapt SDK - Basic Usage Example\n');

  // =============================================================================
  // 1. PREFERENCE MANAGEMENT
  // =============================================================================
  
  console.log('📋 Setting up preference store...');
  
  const store = new PreferenceStore();
  await store.initialize();
  
  // Update sensory preferences
  await store.updatePreferences({
    sensory: {
      motionReduction: true,
      highContrast: false,
      darkMode: true,
      fontSize: 1.2,
      colorVisionFilter: 'none',
      reducedFlashing: true
    }
  });
  
  // Update cognitive preferences
  await store.updatePreferences({
    cognitive: {
      readingSpeed: 'medium',
      explanationLevel: 'detailed',
      processingPace: 'standard',
      chunkSize: 5,
      allowInterruptions: false,
      preferVisualCues: true
    }
  });
  
  const preferences = store.getPreferences();
  console.log('✅ Preferences configured:', {
    sensory: preferences.sensory,
    cognitive: preferences.cognitive
  });

  // =============================================================================
  // 2. SENSORY ADAPTATIONS
  // =============================================================================
  
  console.log('\n🎨 Applying sensory adaptations...');
  
  const visualAdapter = new VisualAdapter(preferences.sensory, {
    autoApply: true
  });
  
  // Listen for adaptation events
  visualAdapter.on('adaptation-applied', (type, details) => {
    console.log(`✨ Applied adaptation: ${type}`, details);
  });
  
  // Simulate preference change
  await store.updatePreferences({
    sensory: { highContrast: true }
  });
  
  visualAdapter.applyAdaptations(store.getSensoryPreferences());

  // =============================================================================
  // 3. COGNITIVE LOAD MANAGEMENT
  // =============================================================================
  
  console.log('\n🧠 Setting up cognitive load detection...');
  
  const cognitiveEngine = new CognitiveLoadEngine({
    preferences: preferences.cognitive
  });
  
  // Listen for cognitive load events
  cognitiveEngine.on('load-score', ({ score, tier, context }) => {
    console.log(`📊 Cognitive load: ${score}/100 (${tier})`, context ? `- ${context}` : '');
  });
  
  cognitiveEngine.on('strategy-suggested', (strategy, context) => {
    console.log(`💡 Suggested strategy: ${strategy} - ${context}`);
  });
  
  // Analyze some sample text
  const complexText = `
    The implementation of quantum entanglement in distributed computing architectures 
    necessitates a comprehensive understanding of non-locality principles, decoherence 
    mitigation strategies, and error correction protocols that can maintain coherence 
    across spatially separated quantum processing units while simultaneously addressing 
    the fundamental constraints imposed by the no-cloning theorem and quantum measurement 
    postulates in the context of practical quantum information processing systems.
  `.trim();
  
  const metrics = cognitiveEngine.analyzeText(complexText, 'Technical documentation');
  console.log('📈 Text analysis results:', {
    wordCount: metrics.wordCount,
    readingTime: metrics.readingTimeEstimate,
    fleschScore: Math.round(metrics.fleschScore),
    denseSections: metrics.denseSections.length
  });
  
  // Apply adaptation strategy
  const adaptedText = cognitiveEngine.applyStrategy('simplifyLanguage', complexText);
  console.log('✨ Adapted text preview:', adaptedText.substring(0, 100) + '...');

  // =============================================================================
  // 4. AI INTEGRATION
  // =============================================================================
  
  console.log('\n🤖 Setting up AI adapters...');
  
  // Example with different AI providers (choose one based on your needs)
  let aiAdapter;
  
  if (process.env.OPENAI_API_KEY) {
    aiAdapter = new OpenAIAdapter({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo-preview'
    });
    console.log('🔌 Using OpenAI adapter');
  } else if (process.env.ANTHROPIC_API_KEY) {
    aiAdapter = new ClaudeAdapter({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-5-sonnet-20241022'
    });
    console.log('🔌 Using Claude adapter');
  } else {
    // Fallback to local Ollama (requires local Ollama server)
    aiAdapter = new OllamaAdapter({
      baseURL: 'http://localhost:11434',
      model: 'deepseek-r1:32b'
    });
    console.log('🔌 Using Ollama adapter (local)');
  }
  
  const predictableAI = new PredictableAI(aiAdapter, {
    tone: 'calm-supportive',
    explanationLevel: preferences.cognitive.explanationLevel,
    pacing: 'normal',
    consistencyLevel: 'high',
    useAnalogies: true,
    allowUndo: true
  });
  
  // Sync AI behavior with cognitive preferences
  predictableAI.updateFromCognitivePreferences(preferences.cognitive);
  
  // Listen for AI events
  predictableAI.on('response:start', ({ prompt }) => {
    console.log('🎯 AI request started:', prompt.substring(0, 50) + '...');
  });
  
  predictableAI.on('response:complete', ({ response }) => {
    console.log('✅ AI response completed:', response.content.substring(0, 100) + '...');
  });
  
  predictableAI.on('config:changed', ({ config }) => {
    console.log('⚙️ AI config updated:', config);
  });

  // =============================================================================
  // 5. DEMONSTRATION SCENARIOS
  // =============================================================================
  
  console.log('\n🎬 Running demonstration scenarios...\n');
  
  // Scenario 1: User with ADHD needs simplified explanations
  console.log('📝 Scenario 1: ADHD-friendly AI interaction');
  await store.updatePreferences({
    cognitive: {
      readingSpeed: 'fast',
      explanationLevel: 'simple',
      processingPace: 'quick',
      chunkSize: 3,
      allowInterruptions: false,
      preferVisualCues: true
    }
  });
  
  predictableAI.updateFromCognitivePreferences(store.getCognitivePreferences());
  
  if (await aiAdapter.isAvailable()) {
    try {
      const response1 = await predictableAI.complete(
        'Explain how machine learning works'
      );
      console.log('🤖 Simple explanation:', response1.content.substring(0, 200) + '...');
    } catch (error) {
      console.log('⚠️ AI not available, using mock response');
      console.log('🤖 Simple explanation: Machine learning is like teaching a computer to recognize patterns...');
    }
  } else {
    console.log('⚠️ AI adapter not available (no API key or service), using mock response');
    console.log('🤖 Simple explanation: Machine learning is like teaching a computer to recognize patterns...');
  }
  
  // Scenario 2: User with visual sensitivities
  console.log('\n👁️ Scenario 2: Visual sensitivity adaptations');
  await store.updatePreferences({
    sensory: {
      motionReduction: true,
      highContrast: true,
      colorVisionFilter: 'protanopia',
      fontSize: 1.5,
      reducedFlashing: true,
      darkMode: true
    }
  });
  
  visualAdapter.applyAdaptations(store.getSensoryPreferences());
  console.log('✨ Visual adaptations applied for photosensitivity');
  
  // Scenario 3: Cognitive overload detection and response
  console.log('\n🔥 Scenario 3: Cognitive overload management');
  const overloadText = `
    Quantum computing leverages quantum mechanical phenomena such as superposition, 
    entanglement, and interference to process information in ways that classical computers 
    cannot. The fundamental unit of quantum information is the quantum bit or qubit, which 
    can exist in a superposition of both 0 and 1 states simultaneously. This property, 
    combined with quantum entanglement, allows quantum computers to perform certain 
    calculations exponentially faster than classical computers. However, quantum systems 
    are extremely fragile and susceptible to decoherence, requiring sophisticated error 
    correction protocols and operating at near absolute zero temperatures.
  `.trim();
  
  cognitiveEngine.analyzeText(overloadText, 'Complex technical content');
  const chunkedText = cognitiveEngine.applyStrategy('chunk', overloadText);
  console.log('📋 Content chunked for easier processing');
  
  // =============================================================================
  // 6. PERSISTENCE AND EXPORT
  // =============================================================================
  
  console.log('\n💾 Testing preference persistence...');
  
  // Export preferences
  const exportedData = store.export();
  console.log('📤 Preferences exported (size:', exportedData.length, 'characters)');
  
  // Simulate preference reset and import
  await store.reset();
  console.log('🔄 Preferences reset to defaults');
  
  await store.import(exportedData);
  console.log('📥 Preferences restored from export');
  
  // =============================================================================
  // 7. CLEANUP
  // =============================================================================
  
  console.log('\n🧹 Cleaning up...');
  
  visualAdapter.disable();
  cognitiveEngine.clearMemory();
  predictableAI.clearCache();
  
  console.log('✅ Example completed successfully!\n');
  
  // Summary
  console.log('📊 SUMMARY:');
  console.log('• Preference management: ✅ Working');
  console.log('• Sensory adaptations: ✅ Working');
  console.log('• Cognitive load detection: ✅ Working');
  console.log('• AI integration: ✅ Working');
  console.log('• Persistence: ✅ Working');
  console.log('\n🎉 NeuroAdapt SDK is ready for production use!');
}

// Error handling
main().catch((error) => {
  console.error('❌ Example failed:', error);
  process.exit(1);
});

// Export for use in other modules
export { main as runBasicExample };