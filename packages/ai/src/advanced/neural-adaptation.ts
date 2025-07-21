/**
 * Neural Adaptation System - Real-time neural network for accessibility adaptation
 * @fileoverview Implements neural networks for continuous learning and optimization of user preferences
 */

import { EventEmitter } from 'eventemitter3';

export interface NeuralLayer {
  weights: number[][];
  biases: number[];
  activation: ActivationFunction;
  dropout?: number;
}

export type ActivationFunction = 'relu' | 'sigmoid' | 'tanh' | 'leaky_relu' | 'softmax';

export interface NeuralNetworkConfig {
  layers: number[];
  activations: ActivationFunction[];
  learningRate: number;
  momentum: number;
  regularization: number;
  batchSize: number;
  maxEpochs: number;
  convergenceThreshold: number;
}

export interface TrainingData {
  inputs: number[];
  targets: number[];
  userId: string;
  timestamp: Date;
  context: {
    deviceType: string;
    environment: string;
    timeOfDay: number;
    cognitiveState: number;
  };
}

export interface PredictionResult {
  adaptations: {
    visual: number[];
    cognitive: number[];
    motor: number[];
    sensory: number[];
  };
  confidence: number;
  reasoning: string[];
  alternatives: Array<{
    adaptations: any;
    confidence: number;
  }>;
}

export interface LearningMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  validationLoss: number;
  validationAccuracy: number;
  learningRate: number;
  convergenceRate: number;
}

/**
 * Neural Adaptation System for real-time accessibility optimization
 */
export class NeuralAdaptationSystem extends EventEmitter {
  private network: NeuralLayer[] = [];
  private trainingHistory: LearningMetrics[] = [];
  private realtimeBuffer: TrainingData[] = [];
  private isTraining: boolean = false;
  private currentEpoch: number = 0;
  
  constructor(
    private config: NeuralNetworkConfig = {
      layers: [24, 64, 32, 16, 8], // Input -> Hidden layers -> Output
      activations: ['relu', 'relu', 'relu', 'relu', 'sigmoid'],
      learningRate: 0.001,
      momentum: 0.9,
      regularization: 0.01,
      batchSize: 32,
      maxEpochs: 1000,
      convergenceThreshold: 0.001
    }
  ) {
    super();
    this.initializeNetwork();
  }

  /**
   * Initialize neural network with random weights
   */
  private initializeNetwork(): void {
    this.network = [];
    
    for (let i = 0; i < this.config.layers.length - 1; i++) {
      const inputSize = this.config.layers[i];
      const outputSize = this.config.layers[i + 1];
      
      // Xavier/Glorot initialization
      const limit = Math.sqrt(6 / (inputSize + outputSize));
      
      const layer: NeuralLayer = {
        weights: Array(outputSize).fill(0).map(() =>
          Array(inputSize).fill(0).map(() => 
            (Math.random() * 2 - 1) * limit
          )
        ),
        biases: Array(outputSize).fill(0).map(() => 
          (Math.random() * 2 - 1) * 0.1
        ),
        activation: this.config.activations[i],
        dropout: i < this.config.layers.length - 2 ? 0.2 : undefined
      };
      
      this.network.push(layer);
    }
    
    this.emit('network_initialized', {
      layers: this.config.layers,
      totalParameters: this.getTotalParameters()
    });
  }

  /**
   * Forward propagation through the network
   */
  private forward(inputs: number[], training: boolean = false): number[][] {
    const activations: number[][] = [inputs];
    
    for (let i = 0; i < this.network.length; i++) {
      const layer = this.network[i];
      const prevActivation = activations[i];
      const output = this.computeLayerOutput(layer, prevActivation, training);
      activations.push(output);
    }
    
    return activations;
  }

  /**
   * Compute output for a single layer
   */
  private computeLayerOutput(layer: NeuralLayer, inputs: number[], training: boolean): number[] {
    const output = layer.weights.map((weights, neuronIndex) => {
      // Weighted sum + bias
      const sum = weights.reduce((acc, weight, inputIndex) => 
        acc + weight * inputs[inputIndex], 0
      ) + layer.biases[neuronIndex];
      
      // Apply activation function
      const activated = this.applyActivation(sum, layer.activation);
      
      // Apply dropout during training
      if (training && layer.dropout && Math.random() < layer.dropout) {
        return 0;
      }
      
      return activated;
    });
    
    return output;
  }

  /**
   * Apply activation function
   */
  private applyActivation(x: number, activation: ActivationFunction): number {
    switch (activation) {
      case 'relu':
        return Math.max(0, x);
      case 'sigmoid':
        return 1 / (1 + Math.exp(-x));
      case 'tanh':
        return Math.tanh(x);
      case 'leaky_relu':
        return x > 0 ? x : 0.01 * x;
      case 'softmax':
        // For softmax, we need the entire layer output, not individual values
        return x; // Will be normalized in post-processing
      default:
        return x;
    }
  }

  /**
   * Backpropagation algorithm
   */
  private backward(
    activations: number[][],
    targets: number[],
    learningRate: number
  ): number {
    const gradients: number[][][] = [];
    const biasGradients: number[][] = [];
    
    // Calculate output layer error
    const outputActivations = activations[activations.length - 1];
    let layerError = outputActivations.map((output, i) => 
      2 * (output - targets[i]) // MSE derivative
    );
    
    // Backpropagate through each layer
    for (let layerIndex = this.network.length - 1; layerIndex >= 0; layerIndex--) {
      const layer = this.network[layerIndex];
      const layerInput = activations[layerIndex];
      
      // Calculate gradients for weights
      const weightGradients = layer.weights.map((weights, neuronIndex) =>
        weights.map((_, inputIndex) =>
          layerError[neuronIndex] * layerInput[inputIndex]
        )
      );
      
      // Calculate gradients for biases
      const biasGradient = layerError.slice();
      
      gradients.unshift(weightGradients);
      biasGradients.unshift(biasGradient);
      
      // Calculate error for previous layer
      if (layerIndex > 0) {
        const prevLayerError = Array(layerInput.length).fill(0);
        
        for (let neuronIndex = 0; neuronIndex < layer.weights.length; neuronIndex++) {
          for (let inputIndex = 0; inputIndex < layer.weights[neuronIndex].length; inputIndex++) {
            prevLayerError[inputIndex] += 
              layerError[neuronIndex] * layer.weights[neuronIndex][inputIndex];
          }
        }
        
        // Apply activation derivative
        layerError = prevLayerError.map((error, i) =>
          error * this.getActivationDerivative(layerInput[i], layer.activation)
        );
      }
    }
    
    // Update weights and biases
    for (let layerIndex = 0; layerIndex < this.network.length; layerIndex++) {
      const layer = this.network[layerIndex];
      
      // Update weights
      for (let neuronIndex = 0; neuronIndex < layer.weights.length; neuronIndex++) {
        for (let inputIndex = 0; inputIndex < layer.weights[neuronIndex].length; inputIndex++) {
          const gradient = gradients[layerIndex][neuronIndex][inputIndex];
          const regularization = this.config.regularization * layer.weights[neuronIndex][inputIndex];
          layer.weights[neuronIndex][inputIndex] -= learningRate * (gradient + regularization);
        }
      }
      
      // Update biases
      for (let neuronIndex = 0; neuronIndex < layer.biases.length; neuronIndex++) {
        layer.biases[neuronIndex] -= learningRate * biasGradients[layerIndex][neuronIndex];
      }
    }
    
    // Calculate loss
    const loss = outputActivations.reduce((sum, output, i) =>
      sum + Math.pow(output - targets[i], 2), 0
    ) / outputActivations.length;
    
    return loss;
  }

  /**
   * Get activation function derivative
   */
  private getActivationDerivative(x: number, activation: ActivationFunction): number {
    switch (activation) {
      case 'relu':
        return x > 0 ? 1 : 0;
      case 'sigmoid':
        const sigmoid = 1 / (1 + Math.exp(-x));
        return sigmoid * (1 - sigmoid);
      case 'tanh':
        return 1 - Math.pow(Math.tanh(x), 2);
      case 'leaky_relu':
        return x > 0 ? 1 : 0.01;
      default:
        return 1;
    }
  }

  /**
   * Train the network with batch data
   */
  async trainBatch(trainingData: TrainingData[]): Promise<LearningMetrics> {
    if (this.isTraining) {
      throw new Error('Network is already training');
    }
    
    this.isTraining = true;
    this.currentEpoch = 0;
    
    try {
      let bestLoss = Infinity;
      let epochsWithoutImprovement = 0;
      const maxEpochsWithoutImprovement = 50;
      
      while (this.currentEpoch < this.config.maxEpochs) {
        const epochLoss = await this.trainEpoch(trainingData);
        
        // Calculate validation metrics
        const validationData = trainingData.slice(-Math.floor(trainingData.length * 0.2));
        const validationLoss = this.evaluateNetwork(validationData);
        
        const metrics: LearningMetrics = {
          epoch: this.currentEpoch,
          loss: epochLoss,
          accuracy: this.calculateAccuracy(trainingData),
          validationLoss,
          validationAccuracy: this.calculateAccuracy(validationData),
          learningRate: this.config.learningRate,
          convergenceRate: Math.abs(bestLoss - epochLoss) / bestLoss
        };
        
        this.trainingHistory.push(metrics);
        this.emit('training_progress', metrics);
        
        // Check for improvement
        if (epochLoss < bestLoss - this.config.convergenceThreshold) {
          bestLoss = epochLoss;
          epochsWithoutImprovement = 0;
        } else {
          epochsWithoutImprovement++;
        }
        
        // Early stopping
        if (epochsWithoutImprovement >= maxEpochsWithoutImprovement) {
          this.emit('training_converged', metrics);
          break;
        }
        
        this.currentEpoch++;
      }
      
      const finalMetrics = this.trainingHistory[this.trainingHistory.length - 1];
      this.emit('training_completed', finalMetrics);
      
      return finalMetrics;
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Train for one epoch
   */
  private async trainEpoch(trainingData: TrainingData[]): Promise<number> {
    const shuffledData = [...trainingData].sort(() => Math.random() - 0.5);
    let totalLoss = 0;
    let batchCount = 0;
    
    for (let i = 0; i < shuffledData.length; i += this.config.batchSize) {
      const batch = shuffledData.slice(i, i + this.config.batchSize);
      const batchLoss = await this.trainBatchData(batch);
      totalLoss += batchLoss;
      batchCount++;
      
      // Allow other operations to run
      if (batchCount % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return totalLoss / batchCount;
  }

  /**
   * Train with a single batch of data
   */
  private async trainBatchData(batch: TrainingData[]): Promise<number> {
    let batchLoss = 0;
    
    for (const sample of batch) {
      const inputs = this.preprocessInputs(sample);
      const targets = this.preprocessTargets(sample);
      
      const activations = this.forward(inputs, true);
      const loss = this.backward(activations, targets, this.config.learningRate);
      
      batchLoss += loss;
    }
    
    return batchLoss / batch.length;
  }

  /**
   * Make prediction for user adaptations
   */
  async predict(
    userId: string,
    currentContext: any,
    userHistory: any[]
  ): Promise<PredictionResult> {
    const inputs = this.createPredictionInputs(userId, currentContext, userHistory);
    const activations = this.forward(inputs, false);
    const output = activations[activations.length - 1];
    
    // Parse output into adaptations
    const adaptations = this.parseOutputToAdaptations(output);
    
    // Calculate confidence based on network certainty
    const confidence = this.calculatePredictionConfidence(output);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(inputs, output, adaptations);
    
    // Generate alternatives
    const alternatives = await this.generateAlternatives(inputs, adaptations);
    
    const result: PredictionResult = {
      adaptations,
      confidence,
      reasoning,
      alternatives
    };
    
    this.emit('prediction_made', result);
    return result;
  }

  /**
   * Add real-time training data
   */
  addRealtimeData(data: TrainingData): void {
    this.realtimeBuffer.push(data);
    
    // Trigger incremental learning if buffer is full
    if (this.realtimeBuffer.length >= this.config.batchSize) {
      this.performIncrementalLearning();
    }
  }

  /**
   * Perform incremental learning with real-time data
   */
  private async performIncrementalLearning(): Promise<void> {
    if (this.isTraining || this.realtimeBuffer.length === 0) {
      return;
    }
    
    const batch = this.realtimeBuffer.splice(0, this.config.batchSize);
    
    try {
      // Reduced learning rate for incremental learning
      const originalLR = this.config.learningRate;
      this.config.learningRate *= 0.1;
      
      await this.trainBatchData(batch);
      
      // Restore original learning rate
      this.config.learningRate = originalLR;
      
      this.emit('incremental_learning_completed', {
        batchSize: batch.length,
        totalParameters: this.getTotalParameters()
      });
    } catch (error) {
      this.emit('incremental_learning_error', error);
    }
  }

  /**
   * Evaluate network performance
   */
  private evaluateNetwork(testData: TrainingData[]): number {
    let totalLoss = 0;
    
    for (const sample of testData) {
      const inputs = this.preprocessInputs(sample);
      const targets = this.preprocessTargets(sample);
      const activations = this.forward(inputs, false);
      const output = activations[activations.length - 1];
      
      const loss = output.reduce((sum, pred, i) =>
        sum + Math.pow(pred - targets[i], 2), 0
      ) / output.length;
      
      totalLoss += loss;
    }
    
    return totalLoss / testData.length;
  }

  /**
   * Calculate prediction accuracy
   */
  private calculateAccuracy(data: TrainingData[]): number {
    let correct = 0;
    
    for (const sample of data) {
      const inputs = this.preprocessInputs(sample);
      const targets = this.preprocessTargets(sample);
      const prediction = this.forward(inputs, false);
      const output = prediction[prediction.length - 1];
      
      // Check if prediction is within acceptable range
      const isCorrect = output.every((pred, i) =>
        Math.abs(pred - targets[i]) < 0.1
      );
      
      if (isCorrect) correct++;
    }
    
    return correct / data.length;
  }

  /**
   * Get total number of parameters in the network
   */
  private getTotalParameters(): number {
    return this.network.reduce((total, layer) => {
      const weightParams = layer.weights.reduce((sum, neuronWeights) => 
        sum + neuronWeights.length, 0
      );
      const biasParams = layer.biases.length;
      return total + weightParams + biasParams;
    }, 0);
  }

  // Utility methods for data preprocessing and parsing
  private preprocessInputs(sample: TrainingData): number[] {
    // Normalize and combine all input features
    return [
      ...sample.inputs,
      sample.context.timeOfDay / 24,
      sample.context.cognitiveState,
      sample.context.deviceType === 'mobile' ? 1 : 0,
      sample.context.environment === 'quiet' ? 1 : 0
    ];
  }

  private preprocessTargets(sample: TrainingData): number[] {
    // Normalize target values to [0, 1] range
    return sample.targets.map(target => Math.max(0, Math.min(1, target)));
  }

  private createPredictionInputs(userId: string, context: any, history: any[]): number[] {
    // Create input vector from current context and user history
    return [
      context.timeOfDay / 24 || 0.5,
      context.cognitiveLoad || 0.5,
      context.environmentNoise || 0.5,
      context.lightLevel || 0.5,
      history.length / 100 || 0.1,
      // Add more context features...
    ].concat(Array(19).fill(0.5)); // Pad to expected input size
  }

  private parseOutputToAdaptations(output: number[]): PredictionResult['adaptations'] {
    // Parse neural network output into structured adaptations
    return {
      visual: output.slice(0, 2), // Contrast, brightness
      cognitive: output.slice(2, 4), // Processing speed, complexity
      motor: output.slice(4, 6), // Target size, timing
      sensory: output.slice(6, 8) // Sound, vibration
    };
  }

  private calculatePredictionConfidence(output: number[]): number {
    // Calculate confidence based on output certainty
    const variance = output.reduce((sum, val) => {
      const mean = output.reduce((a, b) => a + b, 0) / output.length;
      return sum + Math.pow(val - mean, 2);
    }, 0) / output.length;
    
    return Math.max(0, 1 - variance);
  }

  private generateReasoning(inputs: number[], output: number[], adaptations: any): string[] {
    // Generate human-readable reasoning for the prediction
    const reasoning: string[] = [];
    
    if (inputs[1] > 0.7) { // High cognitive load
      reasoning.push('High cognitive load detected, simplifying interface');
    }
    
    if (adaptations.visual[0] < 0.3) { // Low contrast
      reasoning.push('Reducing visual complexity due to sensory sensitivity');
    }
    
    if (adaptations.motor[0] > 0.7) { // Large targets
      reasoning.push('Increasing target sizes for better motor accessibility');
    }
    
    return reasoning;
  }

  private async generateAlternatives(inputs: number[], baseAdaptations: any): Promise<any[]> {
    // Generate alternative adaptation strategies
    return [
      {
        adaptations: {
          ...baseAdaptations,
          visual: baseAdaptations.visual.map((v: number) => v * 0.8)
        },
        confidence: 0.7
      },
      {
        adaptations: {
          ...baseAdaptations,
          cognitive: baseAdaptations.cognitive.map((v: number) => v * 1.2)
        },
        confidence: 0.6
      }
    ];
  }

  /**
   * Export network for persistence
   */
  exportNetwork(): any {
    return {
      config: this.config,
      network: this.network,
      trainingHistory: this.trainingHistory,
      currentEpoch: this.currentEpoch
    };
  }

  /**
   * Import network from saved state
   */
  importNetwork(data: any): void {
    this.config = data.config;
    this.network = data.network;
    this.trainingHistory = data.trainingHistory || [];
    this.currentEpoch = data.currentEpoch || 0;
    
    this.emit('network_imported', {
      totalParameters: this.getTotalParameters(),
      trainingEpochs: this.currentEpoch
    });
  }
}

export default NeuralAdaptationSystem; 