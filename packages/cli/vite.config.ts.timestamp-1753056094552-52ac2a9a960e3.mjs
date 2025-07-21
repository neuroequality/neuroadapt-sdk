// vite.config.ts
import { defineConfig } from "file:///Users/knightdev/neuroadapt-sdk/node_modules/.pnpm/vite@5.4.19_@types+node@20.19.9/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/knightdev/neuroadapt-sdk/node_modules/vite-plugin-dts/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/Users/knightdev/neuroadapt-sdk/packages/cli";
var vite_config_default = defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"]
    })
  ],
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      name: "NeuroAdaptCLI",
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      external: [
        "@neuroadapt/core",
        "commander",
        "inquirer",
        "chalk",
        "ora",
        "fs-extra"
      ],
      output: {
        globals: {
          "@neuroadapt/core": "NeuroAdaptCore",
          "commander": "Commander",
          "inquirer": "Inquirer",
          "chalk": "Chalk",
          "ora": "Ora"
        }
      }
    },
    target: "esnext",
    minify: "esbuild",
    sourcemap: true
  },
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
    }
  },
  test: {
    environment: "node",
    coverage: {
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMva25pZ2h0ZGV2L25ldXJvYWRhcHQtc2RrL3BhY2thZ2VzL2NsaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2tuaWdodGRldi9uZXVyb2FkYXB0LXNkay9wYWNrYWdlcy9jbGkvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2tuaWdodGRldi9uZXVyb2FkYXB0LXNkay9wYWNrYWdlcy9jbGkvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIGR0cyh7XG4gICAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qJ10sXG4gICAgICBleGNsdWRlOiBbJ3NyYy8qKi8qLnRlc3QudHMnLCAnc3JjLyoqLyouc3BlYy50cyddLFxuICAgIH0pLFxuICBdLFxuICBidWlsZDoge1xuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2luZGV4LnRzJyksXG4gICAgICBuYW1lOiAnTmV1cm9BZGFwdENMSScsXG4gICAgICBmb3JtYXRzOiBbJ2VzJywgJ2NqcyddLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IFtcbiAgICAgICAgJ0BuZXVyb2FkYXB0L2NvcmUnLFxuICAgICAgICAnY29tbWFuZGVyJyxcbiAgICAgICAgJ2lucXVpcmVyJyxcbiAgICAgICAgJ2NoYWxrJyxcbiAgICAgICAgJ29yYScsXG4gICAgICAgICdmcy1leHRyYScsXG4gICAgICBdLFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGdsb2JhbHM6IHtcbiAgICAgICAgICAnQG5ldXJvYWRhcHQvY29yZSc6ICdOZXVyb0FkYXB0Q29yZScsXG4gICAgICAgICAgJ2NvbW1hbmRlcic6ICdDb21tYW5kZXInLFxuICAgICAgICAgICdpbnF1aXJlcic6ICdJbnF1aXJlcicsXG4gICAgICAgICAgJ2NoYWxrJzogJ0NoYWxrJyxcbiAgICAgICAgICAnb3JhJzogJ09yYScsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogJ25vZGUnLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2pzb24nLCAnaHRtbCddLFxuICAgICAgdGhyZXNob2xkczoge1xuICAgICAgICBsaW5lczogODAsXG4gICAgICAgIGJyYW5jaGVzOiA3MCxcbiAgICAgICAgZnVuY3Rpb25zOiA4MCxcbiAgICAgICAgc3RhdGVtZW50czogODAsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXNULFNBQVMsb0JBQW9CO0FBQ25WLE9BQU8sU0FBUztBQUNoQixTQUFTLGVBQWU7QUFGeEIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQ0YsU0FBUyxDQUFDLFVBQVU7QUFBQSxNQUNwQixTQUFTLENBQUMsb0JBQW9CLGtCQUFrQjtBQUFBLElBQ2xELENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUEsTUFDSCxPQUFPLFFBQVEsa0NBQVcsY0FBYztBQUFBLE1BQ3hDLE1BQU07QUFBQSxNQUNOLFNBQVMsQ0FBQyxNQUFNLEtBQUs7QUFBQSxJQUN2QjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLFNBQVM7QUFBQSxVQUNQLG9CQUFvQjtBQUFBLFVBQ3BCLGFBQWE7QUFBQSxVQUNiLFlBQVk7QUFBQSxVQUNaLFNBQVM7QUFBQSxVQUNULE9BQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxFQUNiO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLElBQy9CO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsVUFBVTtBQUFBLE1BQ1IsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUEsTUFDakMsWUFBWTtBQUFBLFFBQ1YsT0FBTztBQUFBLFFBQ1AsVUFBVTtBQUFBLFFBQ1YsV0FBVztBQUFBLFFBQ1gsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
