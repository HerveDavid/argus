<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";

  async function pause() {
    try {
      await invoke("plugin:plugin-game-engine|pause");
      console.log("Game paused successfully");
    } catch (error) {
      console.error("Failed to pause game:", error);
    }
  }

  async function resume() {
    try {
      await invoke("plugin:plugin-game-engine|resume");
      console.log("Game resumed successfully");
    } catch (error) {
      console.error("Failed to resume game:", error);
    }
  }

  async function stop() {
    try {
      await invoke("plugin:plugin-game-engine|stop");
      console.log("Game stopped successfully");
    } catch (error) {
      console.error("Failed to stop game:", error);
    }
  }
</script>

<button on:click={() => pause()}>Pause</button>
<button on:click={() => resume()}>Resume</button>
<button on:click={() => stop()}>Stop</button>
