import { useState } from 'react';
import { useSensoryAdaptations, useCognitiveLoad } from '@neuroadapt/core';
import './App.css';

function App() {
  const { 
    preferences, 
    updatePreference, 
    isLoading 
  } = useSensoryAdaptations({
    autoApply: true
  });

  const {
    analyzeText,
    currentLoad,
    suggestions
  } = useCognitiveLoad({
    preferences: {
      readingSpeed: 'medium',
      explanationLevel: 'detailed',
      processingPace: 'standard',
      chunkSize: 5,
      allowInterruptions: true,
      preferVisualCues: false
    }
  });

  const [textToAnalyze, setTextToAnalyze] = useState('');

  const handleAnalyzeText = () => {
    if (textToAnalyze.trim()) {
      analyzeText(textToAnalyze);
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <p>Loading NeuroAdapt preferences...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧠 NeuroAdapt Demo App</h1>
        <p>Experience adaptive interfaces that learn and respond to your needs</p>
      </header>

      <main className="main-content">
        <section className="preferences-panel">
          <h2>Sensory Preferences</h2>
          
          <div className="preference-group">
            <label>
              <input
                type="checkbox"
                checked={preferences.motionReduction}
                onChange={(e) => updatePreference('motionReduction', e.target.checked)}
              />
              Reduce Motion
            </label>
            <small>Disables animations and smooth scrolling</small>
          </div>

          <div className="preference-group">
            <label>
              <input
                type="checkbox"
                checked={preferences.highContrast}
                onChange={(e) => updatePreference('highContrast', e.target.checked)}
              />
              High Contrast
            </label>
            <small>Increases visual contrast for better readability</small>
          </div>

          <div className="preference-group">
            <label>
              <input
                type="checkbox"
                checked={preferences.darkMode}
                onChange={(e) => updatePreference('darkMode', e.target.checked)}
              />
              Dark Mode
            </label>
            <small>Switches to dark color scheme</small>
          </div>

          <div className="preference-group">
            <label htmlFor="fontSize">
              Font Size: {Math.round(preferences.fontSize * 100)}%
            </label>
            <input
              id="fontSize"
              type="range"
              min="0.75"
              max="2"
              step="0.125"
              value={preferences.fontSize}
              onChange={(e) => updatePreference('fontSize', parseFloat(e.target.value))}
            />
          </div>

          <div className="preference-group">
            <label htmlFor="colorFilter">Color Vision Filter</label>
            <select
              id="colorFilter"
              value={preferences.colorVisionFilter}
              onChange={(e) => updatePreference('colorVisionFilter', e.target.value as any)}
            >
              <option value="none">None</option>
              <option value="protanopia">Protanopia (Red-blind)</option>
              <option value="deuteranopia">Deuteranopia (Green-blind)</option>
              <option value="tritanopia">Tritanopia (Blue-blind)</option>
            </select>
          </div>
        </section>

        <section className="cognitive-panel">
          <h2>Cognitive Load Analysis</h2>
          
          <div className="text-analyzer">
            <label htmlFor="textInput">Enter text to analyze:</label>
            <textarea
              id="textInput"
              value={textToAnalyze}
              onChange={(e) => setTextToAnalyze(e.target.value)}
              placeholder="Paste or type text here to analyze cognitive load..."
              rows={4}
            />
            <button onClick={handleAnalyzeText} disabled={!textToAnalyze.trim()}>
              Analyze Text
            </button>
          </div>

          {currentLoad && (
            <div className="load-results">
              <h3>Analysis Results</h3>
              <div className="load-meter">
                <div className="load-bar">
                  <div 
                    className={`load-fill load-${currentLoad.tier}`}
                    style={{ width: `${currentLoad.score}%` }}
                  />
                </div>
                <span>Load: {currentLoad.score}/100 ({currentLoad.tier})</span>
              </div>
              
              {suggestions.length > 0 && (
                <div className="suggestions">
                  <h4>Suggestions:</h4>
                  <ul>
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="demo-content">
          <h2>Sample Content</h2>
          <p>
            This content adapts to your preferences in real-time. Try adjusting the 
            settings above to see how the interface changes to meet your needs.
          </p>
          
          <div className="feature-grid">
            <div className="feature-card">
              <h3>🎨 Visual Adaptations</h3>
              <p>Motion reduction, high contrast, color filtering, and font scaling.</p>
            </div>
            
            <div className="feature-card">
              <h3>🧠 Cognitive Support</h3>
              <p>Intelligent pacing, content chunking, and overload detection.</p>
            </div>
            
            <div className="feature-card">
              <h3>🤖 Predictable AI</h3>
              <p>Consistent, tone-aware responses with undo functionality.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Built with NeuroAdapt SDK v1.1.0</p>
        <p>
          <a href="https://neuroadapt.dev" target="_blank" rel="noopener noreferrer">
            Learn more about NeuroAdapt
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;