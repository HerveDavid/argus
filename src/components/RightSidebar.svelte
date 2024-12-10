<script lang="ts">
  let properties = {
    width: 800,
    height: 600,
    opacity: 100,
    fill: "#000000",
    stroke: "#000000",
    strokeWidth: 1,
  };
</script>

<div class="w-64 bg-gray-800 border-l border-gray-700 p-4">
  <h2 class="text-lg font-semibold mb-4">Properties</h2>

  <div class="space-y-4">
    <div>
      <label class="block text-sm mb-1">Dimensions</label>
      <div class="flex space-x-2">
        <input
          type="number"
          bind:value={properties.width}
          class="flex-1 bg-gray-700 rounded px-2 py-1"
        />
        <input
          type="number"
          bind:value={properties.height}
          class="flex-1 bg-gray-700 rounded px-2 py-1"
        />
      </div>
    </div>

    <div>
      <label class="block text-sm mb-1">Opacity</label>
      <input
        type="range"
        bind:value={properties.opacity}
        min="0"
        max="100"
        class="w-full"
      />
    </div>

    <div>
      <label class="block text-sm mb-1">Fill</label>
      <input
        type="color"
        bind:value={properties.fill}
        class="w-full h-8 bg-gray-700 rounded"
      />
    </div>

    <div>
      <label class="block text-sm mb-1">Stroke</label>
      <div class="flex space-x-2">
        <input
          type="color"
          bind:value={properties.stroke}
          class="flex-1 h-8 bg-gray-700 rounded"
        />
        <input
          type="number"
          bind:value={properties.strokeWidth}
          class="w-20 bg-gray-700 rounded px-2"
          min="0"
        />
      </div>
    </div>
  </div>
</div>
