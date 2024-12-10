<script lang="ts">
  let tools = [
    { id: "select", icon: "◻️", name: "Select" },
    { id: "move", icon: "↖️", name: "Move" },
    { id: "rectangle", icon: "⬜", name: "Rectangle" },
    { id: "circle", icon: "⭕", name: "Circle" },
    { id: "text", icon: "T", name: "Text" },
  ];

  let layers = [
    { id: 1, name: "Background", visible: true },
    { id: 2, name: "Layer 1", visible: true },
    { id: 3, name: "Layer 2", visible: false },
  ];

  let activeTab = "tools";
</script>

<div class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
  <div class="flex border-b border-gray-700">
    <button
      class="flex-1 py-2 {activeTab === 'tools' ? 'bg-gray-700' : ''}"
      on:click={() => (activeTab = "tools")}
    >
      Tools
    </button>
    <button
      class="flex-1 py-2 {activeTab === 'layers' ? 'bg-gray-700' : ''}"
      on:click={() => (activeTab = "layers")}
    >
      Layers
    </button>
  </div>

  {#if activeTab === "tools"}
    <div class="p-4 grid grid-cols-2 gap-2">
      {#each tools as tool}
        <button
          class="aspect-square flex items-center justify-center rounded hover:bg-gray-700"
          title={tool.name}
        >
          {tool.icon}
        </button>
      {/each}
    </div>
  {:else}
    <div class="flex-1 p-2">
      {#each layers as layer}
        <div class="flex items-center p-2 hover:bg-gray-700 rounded">
          <input type="checkbox" checked={layer.visible} class="mr-2" />
          <span>{layer.name}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
