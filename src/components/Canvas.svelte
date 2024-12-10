<script lang="ts">
  let scale = 1;
  let position = { x: 0, y: 0 };

  function handleWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      scale = Math.max(
        0.1,
        Math.min(5, scale + (event.deltaY > 0 ? -0.1 : 0.1))
      );
    } else {
      position.x -= event.deltaX;
      position.y -= event.deltaY;
    }
  }
</script>

<div class="flex-1 bg-gray-900 overflow-hidden relative" on:wheel={handleWheel}>
  <div
    class="absolute"
    style="transform: translate({position.x}px, {position.y}px) scale({scale})"
  >
    <div class="w-[800px] h-[600px] bg-white">
      <!-- Zone d'édition -->
    </div>
  </div>
</div>
