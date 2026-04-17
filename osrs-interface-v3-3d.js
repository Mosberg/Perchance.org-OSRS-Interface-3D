import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";

(() => {
  "use strict";

  const CLIENT_WIDTH = 765;
  const CLIENT_HEIGHT = 503;
  const CLIENT_PADDING = 24;
  const WORLD_SPAN = 26;

  const LAYOUT_FIXED_CLASSIC = "fixed-classic";
  const LAYOUT_RESIZABLE_CLASSIC = "resizable-classic";
  const LAYOUT_RESIZABLE_MODERN = "resizable-modern";
  const LAYOUT_VALUES = new Set([
    LAYOUT_FIXED_CLASSIC,
    LAYOUT_RESIZABLE_CLASSIC,
    LAYOUT_RESIZABLE_MODERN,
  ]);

  const SCALING_NEAREST_NEIGHBOUR = "nearest-neighbour";
  const SCALING_LINEAR = "linear";
  const SCALING_BICUBIC = "bicubic";
  const SCALING_MODE_VALUES = new Set([
    SCALING_NEAREST_NEIGHBOUR,
    SCALING_LINEAR,
    SCALING_BICUBIC,
  ]);

  const TOP_TABS = [
    { id: "combat", short: "CB", label: "Combat Options" },
    { id: "skills", short: "SK", label: "Skills" },
    { id: "quests", short: "QP", label: "Quest List" },
    { id: "inventory", short: "INV", label: "Inventory" },
    { id: "equipment", short: "EQP", label: "Worn Equipment" },
    { id: "prayer", short: "PRY", label: "Prayer" },
    { id: "magic", short: "MAG", label: "Spellbook" },
    { id: "sailing", short: "SEA", label: "Sailing Options" },
  ];

  const BOTTOM_TABS = [
    { id: "friends", short: "FR", label: "Friends List" },
    { id: "ignore", short: "IG", label: "Ignore List" },
    { id: "clan", short: "CL", label: "Clan" },
    { id: "account", short: "ACC", label: "Account Management" },
    { id: "logout", short: "LOG", label: "Logout" },
    { id: "settings", short: "SET", label: "Settings" },
    { id: "emotes", short: "EM", label: "Emotes" },
    { id: "music", short: "MUS", label: "Music Player" },
  ];

  const CHAT_CHANNELS = ["All", "Game", "Public", "Private", "Clan", "Trade"];

  const state = {
    runtime: {
      world: 302,
      startedAt: Date.now(),
      heading: 0,
    },
    ui: {
      activeGroup: "top",
      activeTop: "inventory",
      activeBottom: "friends",
      selectedItemIndex: null,
      selectedPrayer: "Thick Skin",
      selectedSpell: "Wind Strike",
      chatChannel: "All",
      contextOpen: false,
      contextPayload: null,
    },
    markers: {
      player: { x: 46, y: 55 },
      target: { x: 64, y: 44 },
    },
    stats: {
      hp: 92,
      maxHp: 99,
      prayer: 78,
      maxPrayer: 99,
      run: 84,
      spec: 100,
      quickPrayer: false,
      running: true,
      autoRetaliate: true,
      combatStyle: "Accurate",
      targetName: "Goblin Scout",
    },
    sailing: {
      route: "Port Sarim to Catherby",
      hull: 91,
      risk: 24,
      windAssist: true,
      preset: "Balanced",
    },
    progression: {
      combatLevel: 92,
      totalLevel: 1684,
      questPoints: 276,
      diaryProgress: 68,
      activePath: "Kandarin Route",
    },
    quests: {
      total: 158,
      completed: 114,
      inProgress: 7,
      highlighted: [
        "Desert Treasure II",
        "Sins of the Father",
        "Song of the Elves",
      ],
    },
    inventory: buildInventory(),
    equipment: {
      head: "Rune Full Helm",
      cape: "Ardougne Cloak",
      neck: "Amulet of Glory",
      weapon: "Abyssal Whip",
      body: "Fighter Torso",
      shield: "Dragon Defender",
      legs: "Rune Platelegs",
      gloves: "Barrows Gloves",
      boots: "Dragon Boots",
      ring: "Berserker Ring",
      ammo: "Diamond Bolts",
    },
    prices: {
      "Abyssal Whip": 2298000,
      "Rune Platelegs": 38600,
      Shark: 857,
      Lobster: 178,
      "Prayer Potion(4)": 8290,
      "Law Rune": 141,
      "Air Rune": 4,
      Coins: 1,
      "Teleport Tablet": 362,
      "Stamina Potion": 8745,
    },
    prayers: [
      "Thick Skin",
      "Burst of Strength",
      "Clarity of Thought",
      "Protect from Magic",
      "Protect from Missiles",
      "Protect from Melee",
      "Piety",
      "Rigour",
      "Augury",
    ],
    spells: [
      "Wind Strike",
      "Water Strike",
      "Fire Bolt",
      "Crumble Undead",
      "Varrock Teleport",
      "Falador Teleport",
      "High Alchemy",
      "Snare",
    ],
    social: {
      friends: [
        { name: "Stone Lynx", world: 302, online: true },
        { name: "Mist Falcon", world: 325, online: true },
        { name: "Mire Finch", world: 0, online: false },
      ],
      ignores: ["bot_runner_03", "goldspam_q7"],
      clan: "Dawn Watch",
      channel: "Lakeside Ops",
      groupingRole: "Scout",
      groupingCooldown: 96,
    },
    settings: {
      gameClientLayout: LAYOUT_FIXED_CLASSIC,
      interfaceScale: 1,
      interfaceScalingMode: SCALING_LINEAR,
      brightness: 62,
      musicVolume: 54,
      effectVolume: 66,
      showGroundItems: true,
      profanityFilter: true,
      roofHiding: true,
      chatTimestamps: false,
    },
    music: {
      nowPlaying: "Sea Shanty 2",
      mode: "Shuffle",
      unlocked: 141,
    },
    chat: {
      entries: [
        { channel: "System", text: "Client initialized." },
        { channel: "Game", text: "You feel rested and ready to adventure." },
        { channel: "Clan", text: "Meet at Catherby docks in 5 minutes." },
      ],
    },
  };

  const refs = {
    clientStage: document.getElementById("client-stage"),
    clientScale: document.getElementById("client-scale"),
    clientShell: document.getElementById("client-shell"),
    viewport: document.getElementById("viewport"),
    worldCanvas: document.getElementById("world-canvas"),
    hintLabel: document.getElementById("hint-label"),
    actorPlayer: document.getElementById("actor-player"),
    actorTarget: document.getElementById("actor-target"),
    topTabs: document.getElementById("top-tabs"),
    bottomTabs: document.getElementById("bottom-tabs"),
    panelTitle: document.getElementById("panel-title"),
    panelSubtitle: document.getElementById("panel-subtitle"),
    panelContent: document.getElementById("panel-content"),
    chatLog: document.getElementById("chat-log"),
    chatFilters: document.getElementById("chat-filters"),
    chatChannelLabel: document.getElementById("chat-channel-label"),
    chatInput: document.getElementById("chat-input"),
    minimap: document.getElementById("minimap"),
    minimapCanvas: document.getElementById("minimap-canvas"),
    headingReadout: document.getElementById("heading-readout"),
    mapPlayerDot: document.getElementById("map-player-dot"),
    mapTargetDot: document.getElementById("map-target-dot"),
    orbHp: document.getElementById("orb-hp"),
    orbPrayer: document.getElementById("orb-prayer"),
    orbRun: document.getElementById("orb-run"),
    orbSpec: document.getElementById("orb-spec"),
    orbHpValue: document.getElementById("orb-hp-value"),
    orbPrayerValue: document.getElementById("orb-prayer-value"),
    orbRunValue: document.getElementById("orb-run-value"),
    orbSpecValue: document.getElementById("orb-spec-value"),
    contextMenu: document.getElementById("context-menu"),
    toastRack: document.getElementById("toast-rack"),
  };

  const threeState = {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    player: null,
    targetMarker: null,
    armL: null,
    armR: null,
    legL: null,
    legR: null,
    head: null,
    lastWidth: 0,
    lastHeight: 0,
    ready: false,
  };

  const topPanelRenderers = {
    combat: renderCombatPanel,
    skills: renderSkillsPanel,
    quests: renderQuestPanel,
    inventory: renderInventoryPanel,
    equipment: renderEquipmentPanel,
    prayer: renderPrayerPanel,
    magic: renderMagicPanel,
    sailing: renderSailingPanel,
  };

  const bottomPanelRenderers = {
    friends: renderFriendsPanel,
    ignore: renderIgnorePanel,
    clan: renderClanPanel,
    account: renderAccountPanel,
    logout: renderLogoutPanel,
    settings: renderSettingsPanel,
    emotes: renderEmotesPanel,
    music: renderMusicPanel,
  };

  function init() {
    bindEvents();
    applyLayoutClass();
    initThreeViewport();
    applyInterfaceScalingMode();
    resizeClient();
    renderTabs();
    renderPanel();
    renderChatFilters();
    renderChatLog();
    renderOrbs();
    updateHeading();
    updateMarkers();
    drawMinimap();

    pushChat("System", "OSRS interface v3 3D loaded.");

    setInterval(stepSimulation, 1000);
    setInterval(movePlayerStep, 120);
    window.addEventListener("resize", resizeClient);
  }

  function bindEvents() {
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("change", onDocumentChange);
    document.addEventListener("contextmenu", onDocumentContextMenu);

    refs.chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        sendChat();
      }
    });

    refs.minimap.addEventListener("click", onMinimapClick);

    refs.viewport.addEventListener("click", (event) => {
      if (event.button !== 0) {
        return;
      }
      const rect = refs.viewport.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setTarget(x, y);
      refs.hintLabel.textContent = "Walking";
      pushChat(
        "Game",
        `Walk target set to ${Math.round(x)}, ${Math.round(y)}.`,
      );
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeContextMenu();
      }
    });
  }

  function onDocumentClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const tabButton = target.closest("[data-tab-id]");
    if (tabButton instanceof HTMLElement) {
      const tabId = tabButton.dataset.tabId;
      const group = tabButton.dataset.tabGroup;
      if (tabId && group === "top") {
        state.ui.activeTop = tabId;
        state.ui.activeGroup = "top";
      }
      if (tabId && group === "bottom") {
        state.ui.activeBottom = tabId;
        state.ui.activeGroup = "bottom";
      }
      renderTabs();
      renderPanel();
      return;
    }

    const channelButton = target.closest("[data-channel]");
    if (channelButton instanceof HTMLElement) {
      const nextChannel = channelButton.dataset.channel || "All";
      if (CHAT_CHANNELS.includes(nextChannel)) {
        state.ui.chatChannel = nextChannel;
        renderChatFilters();
        renderChatLog();
      }
      return;
    }

    const actionButton = target.closest("[data-action]");
    if (actionButton instanceof HTMLElement) {
      executeAction(actionButton.dataset.action || "");
      return;
    }

    const contextActionButton = target.closest("[data-context-action]");
    if (contextActionButton instanceof HTMLElement) {
      executeContextAction(contextActionButton.dataset.contextAction || "");
      closeContextMenu();
      return;
    }

    const itemSlot = target.closest("[data-item-index]");
    if (itemSlot instanceof HTMLElement) {
      state.ui.selectedItemIndex = Number(itemSlot.dataset.itemIndex);
      renderPanel();
      return;
    }

    const prayerToggle = target.closest("[data-prayer-toggle]");
    if (prayerToggle instanceof HTMLElement) {
      const prayerName = prayerToggle.dataset.prayerToggle || "Thick Skin";
      state.ui.selectedPrayer = prayerName;
      state.stats.prayer = clamp(
        state.stats.prayer - 1,
        0,
        state.stats.maxPrayer,
      );
      pushChat("Game", `${prayerName} toggled.`);
      renderPanel();
      renderOrbs();
      return;
    }

    const spellCast = target.closest("[data-spell-cast]");
    if (spellCast instanceof HTMLElement) {
      const spellName = spellCast.dataset.spellCast || "Wind Strike";
      state.ui.selectedSpell = spellName;
      pushChat("Game", `${spellName} cast successfully.`);
      notify("success", `${spellName} cast.`);
      renderPanel();
      return;
    }

    const friendMessage = target.closest("[data-message-friend]");
    if (friendMessage instanceof HTMLElement) {
      const name = friendMessage.dataset.messageFriend || "Friend";
      state.ui.chatChannel = "Private";
      refs.chatInput.value = `/@${name} `;
      refs.chatInput.focus();
      renderChatFilters();
      renderChatLog();
      return;
    }

    if (state.ui.contextOpen && !target.closest("#context-menu")) {
      closeContextMenu();
    }
  }

  function onDocumentChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.matches("[data-client-layout]")) {
      const nextLayout = target.getAttribute("data-client-layout") || "";
      setGameClientLayout(nextLayout, true);
      return;
    }

    if (target.matches("[data-interface-scale]")) {
      if (!isResizableLayout()) {
        return;
      }
      state.settings.interfaceScale = clamp(Number(target.value), 0.8, 1.8);
      resizeClient();
      renderPanel();
      return;
    }

    if (target.matches("[data-interface-scaling-mode]")) {
      const nextMode = target.value;
      if (nextMode && SCALING_MODE_VALUES.has(nextMode)) {
        state.settings.interfaceScalingMode = nextMode;
        applyInterfaceScalingMode();
        resizeThreeViewport();
        drawMinimap();
        renderPanel();
      }
      return;
    }

    if (target.matches("[data-combat-style]")) {
      state.stats.combatStyle = target.value;
      renderPanel();
      return;
    }

    if (target.matches("[data-sailing-preset]")) {
      state.sailing.preset = target.value;
      renderPanel();
      return;
    }

    if (target.matches("[data-setting-range]")) {
      const key = target.getAttribute("data-setting-range");
      if (key && key in state.settings) {
        state.settings[key] = Number(target.value);
        renderPanel();
      }
      return;
    }

    if (target.matches("[data-setting-check]")) {
      const key = target.getAttribute("data-setting-check");
      if (key && key in state.settings) {
        state.settings[key] = Boolean(target.checked);
        renderPanel();
      }
      return;
    }

    if (target.matches("[data-music-mode]")) {
      state.music.mode = target.value;
      renderPanel();
    }
  }

  function onDocumentContextMenu(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const itemSlot = target.closest("[data-item-index]");
    if (itemSlot instanceof HTMLElement) {
      event.preventDefault();
      const index = Number(itemSlot.dataset.itemIndex);
      const item = state.inventory[index];
      if (!item) {
        return;
      }
      openContextMenu(
        event.clientX,
        event.clientY,
        `Choose Option: ${item.name}`,
        [
          { label: `Use ${item.name}`, action: "use-item" },
          { label: `Drop ${item.name}`, action: "drop-item" },
          { label: `Examine ${item.name}`, action: "examine-item" },
          { label: "Cancel", action: "cancel" },
        ],
        { type: "inventory", index },
      );
      return;
    }

    const inViewport = target.closest("#viewport");
    if (inViewport instanceof HTMLElement) {
      event.preventDefault();
      openContextMenu(
        event.clientX,
        event.clientY,
        "Choose Option",
        [
          { label: "Walk here", action: "walk", className: "walk" },
          { label: `Attack ${state.stats.targetName}`, action: "attack" },
          { label: `Examine ${state.stats.targetName}`, action: "examine" },
          { label: "Lookup target (Wiki)", action: "wiki" },
          { label: "Cancel", action: "cancel" },
        ],
        { type: "viewport" },
      );
      return;
    }

    if (target.closest("#context-menu")) {
      event.preventDefault();
      return;
    }

    closeContextMenu();
  }

  function onMinimapClick(event) {
    const rect = refs.minimap.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setTarget(x, y);
    pushChat(
      "Game",
      `You click the minimap at ${Math.round(x)}, ${Math.round(y)}.`,
    );
  }

  function executeAction(action) {
    switch (action) {
      case "send-chat":
        sendChat();
        break;
      case "walk-here":
        refs.hintLabel.textContent = "Walking";
        pushChat("Game", `You walk toward ${state.stats.targetName}.`);
        break;
      case "attack-target":
        pushChat("Game", `You attack ${state.stats.targetName}.`);
        if (state.stats.spec >= 10) {
          state.stats.spec = clamp(state.stats.spec - 10, 0, 100);
        }
        renderOrbs();
        notify("warn", "Combat engaged.");
        break;
      case "examine-target":
        pushChat("Game", `${state.stats.targetName}: Looks alert and ready.`);
        notify("info", `Examined ${state.stats.targetName}.`);
        break;
      case "toggle-choose-option": {
        if (state.ui.contextOpen) {
          closeContextMenu();
        } else {
          const rect = refs.viewport.getBoundingClientRect();
          openContextMenu(
            rect.left + 40,
            rect.top + 46,
            "Choose Option",
            [
              { label: "Walk here", action: "walk", className: "walk" },
              { label: `Attack ${state.stats.targetName}`, action: "attack" },
              { label: `Examine ${state.stats.targetName}`, action: "examine" },
              { label: "Lookup target (Wiki)", action: "wiki" },
              { label: "Cancel", action: "cancel" },
            ],
            { type: "viewport" },
          );
        }
        break;
      }
      case "reset-compass":
        resetCameraToNorth();
        notify("info", "Compass reset.");
        break;
      case "orb-hp":
        notify("info", `HP ${state.stats.hp}/${state.stats.maxHp}`);
        break;
      case "toggle-quick-prayer":
        state.stats.quickPrayer = !state.stats.quickPrayer;
        notify(
          "info",
          `Quick prayer ${state.stats.quickPrayer ? "enabled" : "disabled"}.`,
        );
        renderOrbs();
        break;
      case "toggle-run":
        state.stats.running = !state.stats.running;
        notify("info", state.stats.running ? "Run enabled." : "Run disabled.");
        renderOrbs();
        break;
      case "use-special":
        if (state.stats.spec < 50) {
          notify("warn", "Not enough special energy.");
          return;
        }
        state.stats.spec = clamp(state.stats.spec - 50, 0, 100);
        pushChat("Game", "Special attack unleashed.");
        notify("success", "Special attack activated.");
        renderOrbs();
        break;
      case "open-activity-adviser":
        notify("info", "Activity Adviser opened.");
        break;
      case "open-world-map":
        notify("info", "World Map opened.");
        break;
      case "open-wiki-lookup":
        notify("info", "Wiki lookup opened.");
        break;
      case "open-settings":
        state.ui.activeGroup = "bottom";
        state.ui.activeBottom = "settings";
        renderTabs();
        renderPanel();
        break;
      default:
        break;
    }
  }

  function executeContextAction(action) {
    const payload = state.ui.contextPayload;
    switch (action) {
      case "walk":
        executeAction("walk-here");
        break;
      case "attack":
        executeAction("attack-target");
        break;
      case "examine":
        executeAction("examine-target");
        break;
      case "wiki":
        executeAction("open-wiki-lookup");
        break;
      case "use-item": {
        if (!payload || payload.type !== "inventory") {
          break;
        }
        const item = state.inventory[payload.index];
        if (item) {
          pushChat("Game", `You use ${item.name}.`);
          notify("info", `${item.name} used.`);
        }
        break;
      }
      case "drop-item": {
        if (!payload || payload.type !== "inventory") {
          break;
        }
        const item = state.inventory[payload.index];
        if (item) {
          pushChat("Game", `You drop ${item.name}.`);
          notify("warn", `${item.name} dropped.`);
          state.inventory[payload.index] = null;
          if (state.ui.selectedItemIndex === payload.index) {
            state.ui.selectedItemIndex = null;
          }
          renderPanel();
        }
        break;
      }
      case "examine-item": {
        if (!payload || payload.type !== "inventory") {
          break;
        }
        const item = state.inventory[payload.index];
        if (item) {
          pushChat("Game", `${item.name}: It looks useful.`);
        }
        break;
      }
      default:
        break;
    }
  }

  function openContextMenu(clientX, clientY, title, options, payload) {
    state.ui.contextOpen = true;
    state.ui.contextPayload = payload || null;

    refs.contextMenu.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      ${options
        .map(
          (option) =>
            `<button type="button" class="${option.className || ""}" data-context-action="${option.action}">${escapeHtml(option.label)}</button>`,
        )
        .join("")}
    `;

    const rect = refs.clientShell.getBoundingClientRect();
    const maxX = refs.clientShell.clientWidth - 196;
    const maxY = refs.clientShell.clientHeight - 168;
    const x = clamp(clientX - rect.left, 6, Math.max(6, maxX));
    const y = clamp(clientY - rect.top, 6, Math.max(6, maxY));

    refs.contextMenu.style.left = `${x}px`;
    refs.contextMenu.style.top = `${y}px`;
    refs.contextMenu.classList.remove("hidden");
  }

  function closeContextMenu() {
    state.ui.contextOpen = false;
    state.ui.contextPayload = null;
    refs.contextMenu.classList.add("hidden");
  }

  function setTarget(x, y) {
    state.markers.target.x = clamp(Math.round(x), 4, 96);
    state.markers.target.y = clamp(Math.round(y), 4, 96);
    updateMarkers();
  }

  function movePlayerStep() {
    const p = state.markers.player;
    const t = state.markers.target;

    const dx = t.x - p.x;
    const dy = t.y - p.y;

    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
      refs.hintLabel.textContent = "Walk here";
      return;
    }

    const step = state.stats.running ? 2 : 1;
    p.x = clamp(p.x + Math.sign(dx) * Math.min(step, Math.abs(dx)), 4, 96);
    p.y = clamp(p.y + Math.sign(dy) * Math.min(step, Math.abs(dy)), 4, 96);

    updateMarkers();
  }

  function updateMarkers() {
    const p = state.markers.player;
    const t = state.markers.target;

    const playerViewportTop = 20 + p.y * 0.68;
    const targetViewportTop = 20 + t.y * 0.68;

    refs.actorPlayer.style.left = `${p.x}%`;
    refs.actorPlayer.style.top = `${playerViewportTop}%`;
    refs.actorTarget.style.left = `${t.x}%`;
    refs.actorTarget.style.top = `${targetViewportTop}%`;

    refs.mapPlayerDot.style.left = `${p.x}%`;
    refs.mapPlayerDot.style.top = `${p.y}%`;
    refs.mapTargetDot.style.left = `${t.x}%`;
    refs.mapTargetDot.style.top = `${t.y}%`;

    syncThreeActors();
  }

  function stepSimulation() {
    if (state.stats.running) {
      state.stats.run = clamp(state.stats.run - 1, 0, 100);
    } else {
      state.stats.run = clamp(state.stats.run + 2, 0, 100);
    }

    if (state.stats.quickPrayer) {
      state.stats.prayer = clamp(
        state.stats.prayer - 1,
        0,
        state.stats.maxPrayer,
      );
    }

    if (state.stats.run <= 0) {
      state.stats.running = false;
    }

    if (state.stats.prayer <= 0) {
      state.stats.quickPrayer = false;
    }

    state.stats.spec = clamp(state.stats.spec + 1, 0, 100);
    state.stats.hp = clamp(
      state.stats.hp + randomBetween(-1, 1),
      55,
      state.stats.maxHp,
    );

    if (state.social.groupingCooldown > 0) {
      state.social.groupingCooldown -= 1;
    }

    if (!threeState.controls) {
      state.runtime.heading =
        (state.runtime.heading + (state.stats.running ? 3 : 1)) % 360;
      updateHeading();
    }

    drawMinimap();
    renderOrbs();

    if (
      state.ui.activeTop === "inventory" ||
      state.ui.activeTop === "prayer" ||
      state.ui.activeTop === "magic" ||
      state.ui.activeBottom === "settings"
    ) {
      renderPanel();
    }
  }

  function updateHeading() {
    refs.headingReadout.textContent = `Heading ${String(Math.round(state.runtime.heading)).padStart(3, "0")}`;
  }

  function drawMinimap() {
    const ctx = refs.minimapCanvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const w = refs.minimapCanvas.width;
    const h = refs.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 72, 0, Math.PI * 2);
    ctx.clip();

    const mapGradient = ctx.createRadialGradient(
      cx - 10,
      cy - 14,
      5,
      cx,
      cy,
      74,
    );
    mapGradient.addColorStop(0, "#6f8f5f");
    mapGradient.addColorStop(0.48, "#405634");
    mapGradient.addColorStop(1, "#1d2917");
    ctx.fillStyle = mapGradient;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
    ctx.lineWidth = 1;
    for (let i = 8; i < w; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = 8; i < h; i += 16) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((state.runtime.heading * Math.PI) / 180);

    ctx.fillStyle = "#d14f45";
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.lineTo(5, -6);
    ctx.lineTo(-5, -6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f2f2f2";
    ctx.beginPath();
    ctx.moveTo(0, 56);
    ctx.lineTo(4, 6);
    ctx.lineTo(-4, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = "rgba(255, 211, 141, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 71, 0, Math.PI * 2);
    ctx.stroke();
  }

  function sendChat() {
    const message = refs.chatInput.value.trim();
    if (!message) {
      return;
    }

    if (message.toLowerCase().startsWith("::wiki ")) {
      const term = message.slice(7).trim();
      pushChat("System", `Wiki lookup requested for '${term || "unknown"}'.`);
      refs.chatInput.value = "";
      notify("info", "Wiki command issued.");
      return;
    }

    if (message.startsWith("/@")) {
      const privateText = message.replace(/^\/@\S+\s*/, "").trim();
      pushChat("Private", privateText || "(empty private message)");
      refs.chatInput.value = "";
      return;
    }

    let channel = state.ui.chatChannel;
    let text = message;

    if (message.startsWith("/p ")) {
      channel = "Public";
      text = message.slice(3).trim();
    } else if (message.startsWith("// ")) {
      channel = "Clan";
      text = message.slice(3).trim();
    } else if (message.startsWith("/// ")) {
      channel = "Trade";
      text = message.slice(4).trim();
    }

    pushChat(channel, text || "...");
    refs.chatInput.value = "";
  }

  function pushChat(channel, text) {
    state.chat.entries.push({ channel, text });
    state.chat.entries = state.chat.entries.slice(-180);
    renderChatLog();
  }

  function renderTabs() {
    refs.topTabs.innerHTML = TOP_TABS.map((tab) => {
      const active =
        state.ui.activeGroup === "top" && state.ui.activeTop === tab.id;
      return `<button type="button" class="${active ? "active" : ""}" data-tab-group="top" data-tab-id="${tab.id}" title="${escapeHtml(tab.label)}">${escapeHtml(tab.short)}</button>`;
    }).join("");

    refs.bottomTabs.innerHTML = BOTTOM_TABS.map((tab) => {
      const active =
        state.ui.activeGroup === "bottom" && state.ui.activeBottom === tab.id;
      return `<button type="button" class="${active ? "active" : ""}" data-tab-group="bottom" data-tab-id="${tab.id}" title="${escapeHtml(tab.label)}">${escapeHtml(tab.short)}</button>`;
    }).join("");
  }

  function renderPanel() {
    const isTop = state.ui.activeGroup === "top";
    const tabId = isTop ? state.ui.activeTop : state.ui.activeBottom;
    const tabDef = (isTop ? TOP_TABS : BOTTOM_TABS).find(
      (tab) => tab.id === tabId,
    );

    refs.panelTitle.textContent = tabDef ? tabDef.label : "Panel";
    refs.panelSubtitle.textContent = isTop ? "Top Panel" : "Bottom Panel";

    const renderer = isTop
      ? topPanelRenderers[tabId]
      : bottomPanelRenderers[tabId];
    refs.panelContent.innerHTML = renderer ? renderer() : renderFallbackPanel();
  }

  function renderCombatPanel() {
    const styles = ["Accurate", "Aggressive", "Defensive", "Controlled"];
    return `
      <section class="module">
        <h3>Combat Setup</h3>
        <div class="kv-grid">
          ${kv("Target", state.stats.targetName)}
          ${kv("Style", state.stats.combatStyle)}
          ${kv("Auto-retaliate", state.stats.autoRetaliate ? "On" : "Off")}
          ${kv("Special", `${state.stats.spec}%`)}
        </div>

        <label>
          Attack style
          <select data-combat-style>
            ${styles
              .map(
                (style) =>
                  `<option value="${style}" ${style === state.stats.combatStyle ? "selected" : ""}>${style}</option>`,
              )
              .join("")}
          </select>
        </label>

        ${meter("Special energy", state.stats.spec, "spec")}
      </section>
    `;
  }

  function renderSkillsPanel() {
    const skills = [
      ["Attack", 82],
      ["Strength", 89],
      ["Defence", 78],
      ["Ranged", 87],
      ["Prayer", 70],
      ["Magic", 85],
      ["Runecraft", 62],
      ["Slayer", 78],
      ["Agility", 71],
      ["Fishing", 86],
    ];

    return `
      <section class="module">
        <h3>Skills</h3>
        <div class="row-list">
          ${skills
            .map(
              ([name, level]) =>
                `<div class="row"><span>${name}</span><span class="badge">${level}</span></div>`,
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderQuestPanel() {
    return `
      <section class="module">
        <h3>Quest List</h3>
        <div class="kv-grid">
          ${kv("Completed", String(state.quests.completed))}
          ${kv("In Progress", String(state.quests.inProgress))}
          ${kv("Total", String(state.quests.total))}
          ${kv("Quest Points", String(state.progression.questPoints))}
        </div>

        <div class="row-list">
          ${state.quests.highlighted
            .map(
              (quest) =>
                `<div class="row"><span>${escapeHtml(quest)}</span><span class="badge warn">Active</span></div>`,
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderInventoryPanel() {
    return `
      <section class="module">
        <h3>Inventory</h3>
        <div class="inventory-grid">
          ${state.inventory
            .map((item, index) => {
              if (!item) {
                return `<button type="button" class="slot empty" data-item-index="${index}"><span class="name">Empty</span><span class="qty">-</span></button>`;
              }
              const active =
                state.ui.selectedItemIndex === index ? "active" : "";
              return `<button type="button" class="slot ${active}" data-item-index="${index}"><span class="name">${escapeHtml(item.name)}</span><span class="qty">x${item.qty}</span></button>`;
            })
            .join("")}
        </div>
        ${renderSelectedItemInfo()}
      </section>
    `;
  }

  function renderSelectedItemInfo() {
    const index = state.ui.selectedItemIndex;
    if (index == null || !state.inventory[index]) {
      return `<div class="row"><span>No item selected</span><span class="badge">Select slot</span></div>`;
    }

    const item = state.inventory[index];
    const unitPrice = state.prices[item.name] || 0;
    const total = unitPrice * item.qty;

    return `
      <div class="row-list">
        <div class="row"><span>Selected</span><span class="badge">${escapeHtml(item.name)}</span></div>
        <div class="row"><span>Quantity</span><span class="badge">${item.qty}</span></div>
        <div class="row"><span>Guide value</span><span class="badge warn">${formatCoins(total)} gp</span></div>
      </div>
    `;
  }

  function renderEquipmentPanel() {
    return `
      <section class="module">
        <h3>Worn Equipment</h3>
        <div class="row-list">
          ${Object.entries(state.equipment)
            .map(
              ([slot, value]) =>
                `<div class="row"><span>${titleCase(slot)}</span><span class="badge">${escapeHtml(value)}</span></div>`,
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderPrayerPanel() {
    return `
      <section class="module">
        <h3>Prayer</h3>
        ${meter("Prayer points", state.stats.prayer, "prayer")}
        <div class="row-list">
          ${state.prayers
            .map((prayer) => {
              const active = prayer === state.ui.selectedPrayer;
              return `<button type="button" class="row" data-prayer-toggle="${escapeHtml(prayer)}"><span>${escapeHtml(prayer)}</span><span class="badge ${active ? "ok" : "warn"}">${active ? "Active" : "Toggle"}</span></button>`;
            })
            .join("")}
        </div>
      </section>
    `;
  }

  function renderMagicPanel() {
    return `
      <section class="module">
        <h3>Spellbook</h3>
        <div class="row-list">
          ${state.spells
            .map((spell) => {
              const selected = spell === state.ui.selectedSpell;
              return `<button type="button" class="row" data-spell-cast="${escapeHtml(spell)}"><span>${escapeHtml(spell)}</span><span class="badge ${selected ? "ok" : "warn"}">${selected ? "Selected" : "Cast"}</span></button>`;
            })
            .join("")}
        </div>
      </section>
    `;
  }

  function renderSailingPanel() {
    const presets = ["Balanced", "Fast", "Safe", "Cargo"];
    return `
      <section class="module">
        <h3>Sailing Options</h3>
        <div class="kv-grid">
          ${kv("Route", state.sailing.route)}
          ${kv("Hull", `${state.sailing.hull}%`)}
          ${kv("Risk", `${state.sailing.risk}%`)}
          ${kv("Wind assist", state.sailing.windAssist ? "On" : "Off")}
        </div>

        <label>
          Speed preset
          <select data-sailing-preset>
            ${presets
              .map(
                (preset) =>
                  `<option value="${preset}" ${preset === state.sailing.preset ? "selected" : ""}>${preset}</option>`,
              )
              .join("")}
          </select>
        </label>

        ${meter("Hull integrity", state.sailing.hull, "run")}
      </section>
    `;
  }

  function renderFriendsPanel() {
    return `
      <section class="module">
        <h3>Friends List</h3>
        <div class="row-list">
          ${state.social.friends
            .map((friend) => {
              const worldLabel = friend.online ? `W${friend.world}` : "Offline";
              const badgeClass = friend.online ? "ok" : "danger";
              return `<div class="row"><span>${escapeHtml(friend.name)}</span><span class="badge ${badgeClass}">${worldLabel}</span><button type="button" data-message-friend="${escapeHtml(friend.name)}">Msg</button></div>`;
            })
            .join("")}
        </div>
      </section>
    `;
  }

  function renderIgnorePanel() {
    return `
      <section class="module">
        <h3>Ignore List</h3>
        <div class="row-list">
          ${state.social.ignores
            .map(
              (name) =>
                `<div class="row"><span>${escapeHtml(name)}</span><span class="badge danger">Ignored</span></div>`,
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderClanPanel() {
    return `
      <section class="module">
        <h3>Clan</h3>
        <div class="kv-grid">
          ${kv("Clan", state.social.clan)}
          ${kv("Channel", state.social.channel)}
          ${kv("Role", state.social.groupingRole)}
          ${kv("Grouping CD", `${state.social.groupingCooldown}s`)}
        </div>
      </section>
    `;
  }

  function renderAccountPanel() {
    return `
      <section class="module">
        <h3>Account Management</h3>
        <div class="kv-grid">
          ${kv("Membership", "Active")}
          ${kv("Authenticator", "Enabled")}
          ${kv("Profile", "Main")}
          ${kv("World", `W${state.runtime.world}`)}
        </div>
      </section>
    `;
  }

  function renderLogoutPanel() {
    const session = Math.floor((Date.now() - state.runtime.startedAt) / 1000);
    return `
      <section class="module">
        <h3>Logout</h3>
        <div class="row-list">
          <div class="row"><span>Current world</span><span class="badge">W${state.runtime.world}</span></div>
          <div class="row"><span>Session time</span><span class="badge">${formatDuration(session)}</span></div>
        </div>
        <button type="button" data-action="open-settings">Open settings before logout</button>
      </section>
    `;
  }

  function renderSettingsPanel() {
    const isResizable = isResizableLayout();
    const scalePercent = Math.round(state.settings.interfaceScale * 100);

    return `
      <section class="module">
        <h3>Settings</h3>

        <section class="module">
          <h3>Game client layout</h3>
          <div class="setting-stack">
            ${renderLayoutOption(
              LAYOUT_FIXED_CLASSIC,
              "Fixed - Classic layout - toggles the game client to be a fixed size of 765x503 pixels.",
            )}
            ${renderLayoutOption(
              LAYOUT_RESIZABLE_CLASSIC,
              "Resizable - Classic layout - toggles the game client to fill the window, but has the side-panels in the classic format.",
            )}
            ${renderLayoutOption(
              LAYOUT_RESIZABLE_MODERN,
              "Resizable - Modern layout - toggles the game client to fill the window, but has the side-panels attached to the bottom of the window.",
            )}
          </div>
        </section>

        <section class="module">
          <h3>Interface scaling</h3>
          <label>
            Scale ${scalePercent}%
            <input type="range" min="0.8" max="1.8" step="0.05" value="${state.settings.interfaceScale.toFixed(2)}" data-interface-scale ${
              isResizable ? "" : "disabled"
            } />
          </label>
          <p class="setting-note">Suitable for large display monitors where the default interface size may appear small. Can only be changed in resizable mode.</p>
        </section>

        <section class="module">
          <h3>Interface scaling mode</h3>
          <label>
            Scaling quality
            <select data-interface-scaling-mode>
              <option value="${SCALING_NEAREST_NEIGHBOUR}" ${state.settings.interfaceScalingMode === SCALING_NEAREST_NEIGHBOUR ? "selected" : ""}>Nearest-Neighbour</option>
              <option value="${SCALING_LINEAR}" ${state.settings.interfaceScalingMode === SCALING_LINEAR ? "selected" : ""}>Linear</option>
              <option value="${SCALING_BICUBIC}" ${state.settings.interfaceScalingMode === SCALING_BICUBIC ? "selected" : ""}>Bicubic</option>
            </select>
          </label>
        </section>

        <label>
          Brightness ${state.settings.brightness}
          <input type="range" min="0" max="100" value="${state.settings.brightness}" data-setting-range="brightness" />
        </label>

        <label>
          Music volume ${state.settings.musicVolume}
          <input type="range" min="0" max="100" value="${state.settings.musicVolume}" data-setting-range="musicVolume" />
        </label>

        <label>
          Effects volume ${state.settings.effectVolume}
          <input type="range" min="0" max="100" value="${state.settings.effectVolume}" data-setting-range="effectVolume" />
        </label>

        <div class="row-list">
          ${renderSettingCheckbox("showGroundItems", "Show ground items")}
          ${renderSettingCheckbox("profanityFilter", "Profanity filter")}
          ${renderSettingCheckbox("roofHiding", "Roof hiding")}
          ${renderSettingCheckbox("chatTimestamps", "Chat timestamps")}
        </div>
      </section>
    `;
  }

  function renderLayoutOption(layoutId, label) {
    return `
      <label class="layout-option">
        <input type="radio" name="game-layout" value="${layoutId}" data-client-layout="${layoutId}" ${
          state.settings.gameClientLayout === layoutId ? "checked" : ""
        } />
        <span>${escapeHtml(label)}</span>
      </label>
    `;
  }

  function renderSettingCheckbox(key, label) {
    return `
      <label class="row">
        <span>${label}</span>
        <input type="checkbox" data-setting-check="${key}" ${state.settings[key] ? "checked" : ""} />
      </label>
    `;
  }

  function renderEmotesPanel() {
    const emotes = [
      "Yes",
      "No",
      "Bow",
      "Cheer",
      "Dance",
      "Wave",
      "Shrug",
      "Beckon",
    ];
    return `
      <section class="module">
        <h3>Emotes</h3>
        <div class="kv-grid">
          ${emotes.map((emote) => `<button type="button">${emote}</button>`).join("")}
        </div>
      </section>
    `;
  }

  function renderMusicPanel() {
    const modes = ["Shuffle", "Repeat", "Area", "Manual"];
    return `
      <section class="module">
        <h3>Music Player</h3>
        <div class="kv-grid">
          ${kv("Now playing", state.music.nowPlaying)}
          ${kv("Unlocked", `${state.music.unlocked} tracks`)}
        </div>

        <label>
          Mode
          <select data-music-mode>
            ${modes
              .map(
                (mode) =>
                  `<option value="${mode}" ${mode === state.music.mode ? "selected" : ""}>${mode}</option>`,
              )
              .join("")}
          </select>
        </label>
      </section>
    `;
  }

  function renderFallbackPanel() {
    return `
      <section class="module">
        <h3>Panel</h3>
        <p>This tab does not have content yet.</p>
      </section>
    `;
  }

  function renderChatFilters() {
    Array.from(refs.chatFilters.querySelectorAll("[data-channel]")).forEach(
      (button) => {
        const active =
          button.getAttribute("data-channel") === state.ui.chatChannel;
        button.classList.toggle("active", active);
      },
    );

    refs.chatChannelLabel.textContent = state.ui.chatChannel;
  }

  function renderChatLog() {
    refs.chatLog.innerHTML = state.chat.entries
      .filter((entry) => {
        return (
          state.ui.chatChannel === "All" ||
          entry.channel === state.ui.chatChannel ||
          entry.channel === "System"
        );
      })
      .slice(-80)
      .map(
        (entry) =>
          `<div class="chat-line"><b>${escapeHtml(entry.channel)}:</b> ${escapeHtml(entry.text)}</div>`,
      )
      .join("");

    refs.chatLog.scrollTop = refs.chatLog.scrollHeight;
  }

  function renderOrbs() {
    setOrb(
      refs.orbHp,
      refs.orbHpValue,
      state.stats.hp,
      state.stats.maxHp,
      String(state.stats.hp),
    );
    setOrb(
      refs.orbPrayer,
      refs.orbPrayerValue,
      state.stats.prayer,
      state.stats.maxPrayer,
      String(state.stats.prayer),
    );
    setOrb(
      refs.orbRun,
      refs.orbRunValue,
      state.stats.run,
      100,
      String(state.stats.run),
    );
    setOrb(
      refs.orbSpec,
      refs.orbSpecValue,
      state.stats.spec,
      100,
      String(state.stats.spec),
    );

    refs.orbPrayer.classList.toggle("active", state.stats.quickPrayer);
    refs.orbRun.classList.toggle("active", state.stats.running);
  }

  function setOrb(orbElement, valueElement, value, maxValue, valueText) {
    const fill = orbElement.querySelector(".orb-fill");
    if (!(fill instanceof HTMLElement)) {
      return;
    }
    const percent = clamp(Math.round((value / maxValue) * 100), 0, 100);
    fill.style.height = `${percent}%`;
    valueElement.textContent = valueText;
  }

  function kv(key, value) {
    return `<div class="kv"><b>${escapeHtml(key)}</b><span>${escapeHtml(value)}</span></div>`;
  }

  function meter(label, value, modeClass) {
    const normalized = clamp(Math.round(value), 0, 100);
    return `<div class="module"><div class="row"><span>${escapeHtml(label)}</span><span class="badge">${normalized}%</span></div><div class="meter ${modeClass}"><span style="width:${normalized}%"></span></div></div>`;
  }

  function notify(level, message, duration = 2200) {
    const toast = document.createElement("div");
    toast.className = `toast ${level}`;
    toast.textContent = message;
    refs.toastRack.append(toast);
    setTimeout(() => {
      toast.remove();
    }, duration);
  }

  function resizeClient() {
    const maxWidth = Math.max(320, window.innerWidth - CLIENT_PADDING);
    const maxHeight = Math.max(260, window.innerHeight - CLIENT_PADDING);

    const layout = state.settings.gameClientLayout;
    let shellWidth = CLIENT_WIDTH;
    let shellHeight = CLIENT_HEIGHT;
    let scale = 1;

    if (layout === LAYOUT_FIXED_CLASSIC) {
      scale = Math.min(maxWidth / CLIENT_WIDTH, maxHeight / CLIENT_HEIGHT, 1);
    } else {
      const interfaceScale = clamp(state.settings.interfaceScale, 0.8, 1.8);
      shellWidth = Math.max(
        CLIENT_WIDTH,
        Math.floor(maxWidth / interfaceScale),
      );
      shellHeight = Math.max(
        CLIENT_HEIGHT,
        Math.floor(maxHeight / interfaceScale),
      );
      scale = interfaceScale;
    }

    refs.clientShell.style.width = `${shellWidth}px`;
    refs.clientShell.style.height = `${shellHeight}px`;
    refs.clientScale.style.width = `${Math.round(shellWidth * scale)}px`;
    refs.clientScale.style.height = `${Math.round(shellHeight * scale)}px`;
    refs.clientScale.style.setProperty("--client-scale", scale.toFixed(4));

    applyInterfaceScalingMode();
    resizeThreeViewport();
  }

  function isResizableLayout() {
    return state.settings.gameClientLayout !== LAYOUT_FIXED_CLASSIC;
  }

  function setGameClientLayout(nextLayout, notifyChange) {
    if (!LAYOUT_VALUES.has(nextLayout)) {
      return;
    }

    const changed = state.settings.gameClientLayout !== nextLayout;
    state.settings.gameClientLayout = nextLayout;

    applyLayoutClass();
    resizeClient();

    if (state.ui.activeBottom === "settings") {
      renderPanel();
    }

    if (changed && notifyChange) {
      notify("info", `${layoutLabel(nextLayout)} selected.`);
    }
  }

  function applyLayoutClass() {
    document.body.classList.remove(
      "layout-fixed-classic",
      "layout-resizable-classic",
      "layout-resizable-modern",
    );
    document.body.classList.add(`layout-${state.settings.gameClientLayout}`);
  }

  function applyInterfaceScalingMode() {
    const mode = state.settings.interfaceScalingMode;

    let rendering = "auto";
    let smoothingEnabled = true;
    let smoothingQuality = "medium";
    let rendererRatio = Math.min(window.devicePixelRatio || 1, 1.5);

    if (mode === SCALING_NEAREST_NEIGHBOUR) {
      rendering = "pixelated";
      smoothingEnabled = false;
      smoothingQuality = "low";
      rendererRatio = 1;
    } else if (mode === SCALING_BICUBIC) {
      smoothingQuality = "high";
      rendererRatio = Math.min(window.devicePixelRatio || 1, 2);
    }

    refs.clientScale.style.setProperty("--interface-rendering", rendering);
    refs.minimapCanvas.style.imageRendering = rendering;

    const minimapCtx = refs.minimapCanvas.getContext("2d");
    if (minimapCtx) {
      minimapCtx.imageSmoothingEnabled = smoothingEnabled;
      if ("imageSmoothingQuality" in minimapCtx) {
        minimapCtx.imageSmoothingQuality = smoothingQuality;
      }
    }

    if (threeState.renderer) {
      threeState.renderer.setPixelRatio(rendererRatio);
      threeState.renderer.domElement.style.imageRendering = rendering;
    }
  }

  function initThreeViewport() {
    const canvas = refs.worldCanvas;
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a6075);
    scene.fog = new THREE.Fog(0x4a6075, 14, 52);

    const camera = new THREE.PerspectiveCamera(58, 512 / 334, 0.1, 1000);
    camera.position.set(0, 6.2, 9.8);

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = Math.PI / 3.4;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.target.set(0, 1.1, 0);

    const planeGeo = new THREE.PlaneGeometry(120, 120);
    const planeMat = new THREE.MeshLambertMaterial({ color: 0x567d46 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    const grid = new THREE.GridHelper(60, 60, 0x2d3d23, 0x2d3d23);
    grid.position.y = 0.01;
    grid.material.transparent = true;
    grid.material.opacity = 0.18;
    scene.add(grid);

    const player = buildThreePlayerModel();
    scene.add(player);

    const targetGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 10);
    const targetMat = new THREE.MeshLambertMaterial({ color: 0xd4665d });
    const targetMarker = new THREE.Mesh(targetGeo, targetMat);
    targetMarker.position.y = 0.6;
    scene.add(targetMarker);

    for (let i = 0; i < 18; i += 1) {
      const size = 0.3 + Math.random() * 0.45;
      const rockGeo = new THREE.BoxGeometry(
        size,
        0.2 + Math.random() * 0.35,
        size,
      );
      const rockMat = new THREE.MeshLambertMaterial({ color: 0x6a6358 });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(randomBetween(-12, 12), 0.1, randomBetween(-12, 12));
      scene.add(rock);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.62);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.82);
    keyLight.position.set(10, 20, 12);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8aa4c0, 0.35);
    fillLight.position.set(-6, 8, -4);
    scene.add(fillLight);

    threeState.renderer = renderer;
    threeState.scene = scene;
    threeState.camera = camera;
    threeState.controls = controls;
    threeState.player = player;
    threeState.targetMarker = targetMarker;
    threeState.ready = true;

    applyInterfaceScalingMode();
    resizeThreeViewport();
    syncThreeActors();
    startThreeRenderLoop();
  }

  function buildThreePlayerModel() {
    const player = new THREE.Group();
    player.position.y = 0.8;

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffd7b5 });
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x003399 });
    const legMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), skinMat);
    head.position.set(0, 1.5, 0);
    player.add(head);

    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.0, 0.5),
      torsoMat,
    );
    torso.position.set(0, 0.8, 0);
    player.add(torso);

    const armL = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.9, 0.25),
      skinMat,
    );
    armL.position.set(-0.6, 0.9, 0);
    player.add(armL);

    const armR = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.9, 0.25),
      skinMat,
    );
    armR.position.set(0.6, 0.9, 0);
    player.add(armR);

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.35), legMat);
    legL.position.set(-0.25, 0.1, 0);
    player.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.35), legMat);
    legR.position.set(0.25, 0.1, 0);
    player.add(legR);

    const bootL = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.25, 0.4),
      bootMat,
    );
    bootL.position.set(-0.25, -0.35, 0);
    player.add(bootL);

    const bootR = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.25, 0.4),
      bootMat,
    );
    bootR.position.set(0.25, -0.35, 0);
    player.add(bootR);

    threeState.armL = armL;
    threeState.armR = armR;
    threeState.legL = legL;
    threeState.legR = legR;
    threeState.head = head;

    return player;
  }

  function startThreeRenderLoop() {
    const renderFrame = () => {
      requestAnimationFrame(renderFrame);

      if (!threeState.ready) {
        return;
      }

      threeState.controls.update();
      animateThreePlayerModel();
      updateHeadingFromCamera();
      threeState.renderer.render(threeState.scene, threeState.camera);
    };

    renderFrame();
  }

  function animateThreePlayerModel() {
    if (!threeState.player) {
      return;
    }

    const t = performance.now() * 0.004;
    const dx = state.markers.target.x - state.markers.player.x;
    const dy = state.markers.target.y - state.markers.player.y;
    const moving = Math.abs(dx) > 1 || Math.abs(dy) > 1;
    const speedMultiplier = state.stats.running ? 1.6 : 1;
    const amplitude = moving ? 0.26 : 0.08;
    const swing =
      Math.sin(t * (moving ? 4.8 * speedMultiplier : 2.4)) * amplitude;

    if (threeState.armL) {
      threeState.armL.rotation.x = swing;
    }
    if (threeState.armR) {
      threeState.armR.rotation.x = -swing;
    }
    if (threeState.legL) {
      threeState.legL.rotation.x = -swing * 1.1;
    }
    if (threeState.legR) {
      threeState.legR.rotation.x = swing * 1.1;
    }
    if (threeState.head) {
      threeState.head.rotation.y = Math.sin(t * 0.38) * 0.08;
    }
  }

  function updateHeadingFromCamera() {
    if (
      !threeState.controls ||
      typeof threeState.controls.getAzimuthalAngle !== "function"
    ) {
      return;
    }

    const azimuthRadians = threeState.controls.getAzimuthalAngle();
    const heading = normalizeHeading(360 - (azimuthRadians * 180) / Math.PI);

    if (Math.abs(heading - state.runtime.heading) > 0.4) {
      state.runtime.heading = heading;
      updateHeading();
      drawMinimap();
    }
  }

  function resetCameraToNorth() {
    if (!threeState.controls || !threeState.camera) {
      state.runtime.heading = 0;
      updateHeading();
      drawMinimap();
      return;
    }

    const target = threeState.controls.target;
    const dx = threeState.camera.position.x - target.x;
    const dz = threeState.camera.position.z - target.z;
    const planarDistance = Math.max(0.01, Math.sqrt(dx * dx + dz * dz));
    const polar =
      typeof threeState.controls.getPolarAngle === "function"
        ? threeState.controls.getPolarAngle()
        : Math.PI / 3;

    const nextY = target.y + Math.cos(polar) * planarDistance;
    const nextZ = target.z + Math.sin(polar) * planarDistance;

    threeState.camera.position.set(target.x, nextY, nextZ);
    threeState.controls.update();

    state.runtime.heading = 0;
    updateHeading();
    drawMinimap();
  }

  function resizeThreeViewport() {
    if (!threeState.renderer || !threeState.camera) {
      return;
    }

    const width = Math.max(1, Math.floor(refs.viewport.clientWidth));
    const height = Math.max(1, Math.floor(refs.viewport.clientHeight));

    if (width === threeState.lastWidth && height === threeState.lastHeight) {
      return;
    }

    threeState.lastWidth = width;
    threeState.lastHeight = height;

    threeState.renderer.setSize(width, height, false);
    threeState.camera.aspect = width / height;
    threeState.camera.updateProjectionMatrix();
  }

  function syncThreeActors() {
    if (!threeState.ready || !threeState.player || !threeState.targetMarker) {
      return;
    }

    const playerWorld = markerToWorld(state.markers.player);
    const targetWorld = markerToWorld(state.markers.target);

    threeState.player.position.x = playerWorld.x;
    threeState.player.position.z = playerWorld.z;

    threeState.targetMarker.position.x = targetWorld.x;
    threeState.targetMarker.position.z = targetWorld.z;

    const faceAngle = Math.atan2(
      targetWorld.x - playerWorld.x,
      targetWorld.z - playerWorld.z,
    );
    if (Number.isFinite(faceAngle)) {
      threeState.player.rotation.y = faceAngle;
    }

    if (threeState.controls && threeState.camera) {
      const offsetX = playerWorld.x - threeState.controls.target.x;
      const offsetZ = playerWorld.z - threeState.controls.target.z;

      threeState.controls.target.set(playerWorld.x, 1.1, playerWorld.z);
      threeState.camera.position.x += offsetX;
      threeState.camera.position.z += offsetZ;
    }
  }

  function markerToWorld(marker) {
    const half = WORLD_SPAN / 2;
    return {
      x: ((marker.x - 50) / 50) * half,
      z: ((marker.y - 50) / 50) * half,
    };
  }

  function layoutLabel(layout) {
    if (layout === LAYOUT_FIXED_CLASSIC) {
      return "Fixed - Classic layout";
    }
    if (layout === LAYOUT_RESIZABLE_CLASSIC) {
      return "Resizable - Classic layout";
    }
    if (layout === LAYOUT_RESIZABLE_MODERN) {
      return "Resizable - Modern layout";
    }
    return layout;
  }

  function buildInventory() {
    return [
      { name: "Abyssal Whip", qty: 1 },
      { name: "Rune Platelegs", qty: 1 },
      { name: "Shark", qty: 7 },
      { name: "Lobster", qty: 3 },
      { name: "Prayer Potion(4)", qty: 4 },
      { name: "Law Rune", qty: 86 },
      { name: "Air Rune", qty: 352 },
      { name: "Coins", qty: 127054 },
      { name: "Teleport Tablet", qty: 6 },
      { name: "Stamina Potion", qty: 2 },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ];
  }

  function titleCase(value) {
    return value
      .split(/[-_]/g)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(" ");
  }

  function formatCoins(value) {
    return Number(value).toLocaleString("en-US");
  }

  function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  function normalizeHeading(value) {
    const normalized = value % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  }

  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  init();
})();
