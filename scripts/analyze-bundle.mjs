#!/usr/bin/env node

import { readdirSync, statSync, existsSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

const packagesDir = resolve('packages');
const reportsDir = resolve('reports');

// Ensure reports directory exists
if (!existsSync(reportsDir)) {
  execSync('mkdir -p reports');
}

const bundleSizeReport = {
  timestamp: new Date().toISOString(),
  packages: {},
  budgets: {
    '@neuroadapt/core': { max: '40KB', gzipped: true },
    '@neuroadapt/ai': { max: '25KB', gzipped: true },
    '@neuroadapt/vr': { max: '30KB', gzipped: true },
    '@neuroadapt/quantum': { max: '35KB', gzipped: true },
    '@neuroadapt/testing': { max: '20KB', gzipped: true },
    '@neuroadapt/cli': { max: '15KB', gzipped: true },
  },
  violations: [],
};

function getSizeInKB(bytes) {
  return Math.round(bytes / 1024 * 100) / 100;
}

function analyzePackage(packageName) {
  const packagePath = join(packagesDir, packageName);
  const distPath = join(packagePath, 'dist');
  
  if (!existsSync(distPath)) {
    console.warn(`⚠️  No dist folder found for ${packageName}`);
    return null;
  }

  const files = readdirSync(distPath, { recursive: true });
  let totalSize = 0;
  const fileDetails = [];

  files.forEach(file => {
    if (typeof file === 'string') {
      const filePath = join(distPath, file);
      try {
        const stats = statSync(filePath);
        if (stats.isFile()) {
          const sizeKB = getSizeInKB(stats.size);
          totalSize += stats.size;
          fileDetails.push({
            name: file,
            size: `${sizeKB}KB`,
            bytes: stats.size
          });
        }
      } catch (error) {
        console.warn(`Could not analyze file ${filePath}:`, error.message);
      }
    }
  });

  return {
    totalSize: getSizeInKB(totalSize),
    files: fileDetails.sort((a, b) => b.bytes - a.bytes)
  };
}

// Analyze all packages
const packages = readdirSync(packagesDir).filter(dir => {
  const packagePath = join(packagesDir, dir);
  return statSync(packagePath).isDirectory();
});

console.log('📊 Analyzing bundle sizes...\n');

packages.forEach(packageName => {
  const analysis = analyzePackage(packageName);
  if (analysis) {
    const packageKey = `@neuroadapt/${packageName}`;
    bundleSizeReport.packages[packageKey] = analysis;
    
    console.log(`📦 ${packageKey}: ${analysis.totalSize}KB`);
    
    // Check against budgets
    const budget = bundleSizeReport.budgets[packageKey];
    if (budget) {
      const maxSizeKB = parseInt(budget.max);
      if (analysis.totalSize > maxSizeKB) {
        const violation = {
          package: packageKey,
          actual: `${analysis.totalSize}KB`,
          budget: budget.max,
          excess: `${Math.round((analysis.totalSize - maxSizeKB) * 100) / 100}KB`
        };
        bundleSizeReport.violations.push(violation);
        console.log(`  ❌ Exceeds budget by ${violation.excess}`);
      } else {
        console.log(`  ✅ Within budget (${budget.max})`);
      }
    }
    
    // Show largest files
    analysis.files.slice(0, 3).forEach(file => {
      console.log(`     ${file.name}: ${file.size}`);
    });
    console.log('');
  }
});

// Write report
const reportPath = join(reportsDir, 'bundle-stats.json');
writeFileSync(reportPath, JSON.stringify(bundleSizeReport, null, 2));

console.log(`📋 Report saved to: ${reportPath}`);

// Exit with error if budget violations
if (bundleSizeReport.violations.length > 0) {
  console.log('\n❌ Bundle size budget violations detected!');
  bundleSizeReport.violations.forEach(v => {
    console.log(`  ${v.package}: ${v.actual} (budget: ${v.budget})`);
  });
  process.exit(1);
} else {
  console.log('\n✅ All packages within bundle size budgets');
} 