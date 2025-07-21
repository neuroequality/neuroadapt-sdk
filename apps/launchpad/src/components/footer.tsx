'use client'

import { Github, Twitter, Globe } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-background/95">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">NeuroAdapt SDK</h3>
            <p className="text-sm text-muted-foreground">
              Building accessible applications for neurodivergent users across AI, VR, and quantum systems.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Documentation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#getting-started" className="text-muted-foreground hover:text-foreground transition-colors">
                  Getting Started
                </a>
              </li>
              <li>
                <a href="#api-reference" className="text-muted-foreground hover:text-foreground transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#examples" className="text-muted-foreground hover:text-foreground transition-colors">
                  Examples
                </a>
              </li>
              <li>
                <a href="#migration" className="text-muted-foreground hover:text-foreground transition-colors">
                  Migration Guide
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Community</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#discord" className="text-muted-foreground hover:text-foreground transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="#discussions" className="text-muted-foreground hover:text-foreground transition-colors">
                  GitHub Discussions
                </a>
              </li>
              <li>
                <a href="#blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#accessibility" className="text-muted-foreground hover:text-foreground transition-colors">
                  Accessibility Guide
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Connect</h4>
            <div className="flex space-x-4">
              <a
                href="https://github.com/neuroadapt/neuroadapt-sdk"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/neuroadapt"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://neuroadapt.dev"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Website"
              >
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © 2024 NeuroAdapt SDK. Open source under MIT License.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#accessibility" className="text-muted-foreground hover:text-foreground transition-colors">
                Accessibility Statement
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}