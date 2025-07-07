// Performance testing and measurement for the Groupify app
// Add this to your browser console to test performance

window.GroupifyPerformanceTest = {
  // Test page load performance
  measurePageLoad: () => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    const domContentLoaded =
      navigation.domContentLoadedEventEnd - navigation.fetchStart;

    console.log("📊 Page Load Performance:");
    console.log(`  Total Load Time: ${loadTime.toFixed(2)}ms`);
    console.log(`  DOM Content Loaded: ${domContentLoaded.toFixed(2)}ms`);
    console.log(
      `  Time to Interactive: ${(
        navigation.loadEventEnd - navigation.fetchStart
      ).toFixed(2)}ms`
    );

    return { loadTime, domContentLoaded };
  },

  // Test component render performance
  measureComponentRenders: () => {
    const renderStart = performance.now();
    console.log("🎬 Starting component render measurement...");

    // Listen for React devtools marks
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes("⚛️")) {
          console.log(`  ${entry.name}: ${entry.duration.toFixed(2)}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ["measure"] });

    setTimeout(() => {
      observer.disconnect();
      const renderEnd = performance.now();
      console.log(
        `📝 Component render measurement completed in ${(
          renderEnd - renderStart
        ).toFixed(2)}ms`
      );
    }, 5000);
  },

  // Test network performance
  measureNetworkRequests: () => {
    const resources = performance.getEntriesByType("resource");
    const slowRequests = resources.filter((r) => r.duration > 100);

    console.log("🌐 Network Performance:");
    console.log(`  Total requests: ${resources.length}`);
    console.log(`  Slow requests (>100ms): ${slowRequests.length}`);

    if (slowRequests.length > 0) {
      console.log("  Slowest requests:");
      slowRequests
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .forEach((req) => {
          console.log(
            `    ${req.name.split("/").pop()}: ${req.duration.toFixed(2)}ms`
          );
        });
    }
  },

  // Test memory usage
  measureMemoryUsage: () => {
    if (performance.memory) {
      const memory = performance.memory;
      console.log("💾 Memory Usage:");
      console.log(
        `  Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(
        `  Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(
        `  Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      );
    } else {
      console.log("Memory API not available");
    }
  },

  // Run all tests
  runAllTests: () => {
    console.log("🚀 Running Groupify Performance Tests...\n");

    GroupifyPerformanceTest.measurePageLoad();
    console.log("");

    GroupifyPerformanceTest.measureNetworkRequests();
    console.log("");

    GroupifyPerformanceTest.measureMemoryUsage();
    console.log("");

    GroupifyPerformanceTest.measureComponentRenders();

    console.log("\n✅ Performance tests initiated. Check console for results.");
  },

  // Monitor performance continuously
  startMonitoring: () => {
    console.log("🔍 Starting continuous performance monitoring...");

    setInterval(() => {
      const now = performance.now();
      console.log(
        `⏱️  Performance check at ${new Date().toLocaleTimeString()}:`
      );
      GroupifyPerformanceTest.measureMemoryUsage();
    }, 30000); // Every 30 seconds
  },
};

// Auto-run on load
console.log("🎯 Groupify Performance Tools Loaded!");
console.log("Run: GroupifyPerformanceTest.runAllTests() to test performance");
console.log(
  "Run: GroupifyPerformanceTest.startMonitoring() for continuous monitoring"
);
