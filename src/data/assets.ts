/**
 * Asset reference manifest — Phase 2.
 * Paths follow kepi_document-conventions_v1.md (public/images/<category>/kepi_<subject>_<variant>.ext).
 */

export const ASSET_MANIFEST = {
  styleRefs: {
    bigFishBegonia1: "docs/assets/kepi_art-style-ref-big-fish-begonia-1.png",
    bigFishBegonia2: "docs/assets/kepi_art-style-ref-big-fish-begonia-2.png",
    moonlightBlade: "docs/assets/kepi_art-style-ref-moonlight-blade.png",
    hakkaBaseShirt: "docs/assets/kepi_art-style-hakka-base-shirt-pants.jpg",
    farmerOutfit: "docs/assets/kepi_art-style-farmer-male-outfit.jpg",
    strawRaincoat: "docs/assets/kepi_art-style-straw-raincoat-outfit.jpg",
  },

  board: {
    /** Default tulou backdrop at 0% repair — same as tulouStage1. */
    main: "/images/board/kepi_tulou-stage1-broken.png",
    tulouStage1: "/images/board/kepi_tulou-stage1-broken.png",
    tulouStage2: "/images/board/kepi_tulou-stage2-well.png",
    tulouStage3: "/images/board/kepi_tulou-stage3-gate.png",
    tulouStage4: "/images/board/kepi_tulou-stage4-roof.png",
    tulouStage5: "/images/board/kepi_tulou-stage5-lanterns.png",
    tulouStage6: "/images/board/kepi_tulou-stage6-renewed.png",
    tulouTransition12: "/images/board/kepi_tulou-transition-1-2.png",
    tulouTransition23: "/images/board/kepi_tulou-transition-2-3.png",
    battleBg: "/images/board/kepi_battle-background.png",
    endingBg: "/images/ending/kepi_ending-background.png",
    seaPassage: "/images/ending/kepi_wind-wave-background.png",
  },

  cinematics: {
    seaDelivery: "/images/cinematics/kepi_victory-sea-delivery.png",
    handoff: "/images/cinematics/kepi_victory-handoff.png",
    sangziReveal: "/images/cinematics/kepi_victory-sangzi-reveal.png",
    repairHome: "/images/cinematics/kepi_victory-repair-home.png",
    letterStack: "/images/cinematics/kepi_victory-letter-stack.png",
    sangziGlow: "/images/cinematics/kepi_victory-sangzi-glow.png",
    waveForeground: "/images/cinematics/kepi_victory-wave-foreground.png",
  },

  characters: {
    farmer: {
      star1: "/images/characters/kepi_farmer.png",
      star2: "/images/characters/kepi_farmer.png",
      star3: "/images/characters/kepi_farmer.png",
    },
    guard: {
      star1: "/images/characters/kepi_guard.png",
      star2: "/images/characters/kepi_guard.png",
      star3: "/images/characters/kepi_guard.png",
    },
    teacher: {
      star1: "/images/characters/kepi_teacher.png",
      star2: "/images/characters/kepi_teacher.png",
      star3: "/images/characters/kepi_teacher.png",
    },
    fengshui: {
      star1: "/images/characters/kepi_fengshui.png",
      star2: "/images/characters/kepi_fengshui.png",
      star3: "/images/characters/kepi_fengshui.png",
    },
    patriarch: {
      star1: "/images/characters/kepi_patriarch.png",
      star2: "/images/characters/kepi_patriarch.png",
      star3: "/images/characters/kepi_patriarch.png",
    },
    shuike: "/images/characters/kepi_shuike.png",
    xiangxian: "/images/characters/kepi_xiangxian.png",
  },

  enemies: {
    qianhaibei: "/images/enemies/kepi_qianhai-stele.png",
    luyinguanli: "/images/enemies/kepi_luyin-clerk.png",
    zhuzaiqi: "/images/enemies/kepi_zhuzai-contract.png",
    ehushan: "/images/enemies/kepi_ehu-mountain.png",
    hongtouchuan: "/images/enemies/kepi_redhead-ship.png",
    xiedouhuo: "/images/enemies/kepi_melee-fire.png",
  },

  ui: {
    gold: "/images/ui/kepi_icon-coin.png",
    population: "/images/ui/kepi_icon-population.png",
    kebi: "/images/ui/kepi_icon-kebi.png",
    sangzi: "/images/ui/kepi_icon-sangzi.png",
    survival: "/images/ui/kepi_icon-survival.png",
    homeRepair: "/images/ui/kepi_icon-home-repair.png",
    homewardTicket: "/images/ui/kepi_icon-return-ticket.png",
    shopRefresh: "/images/ui/kepi_icon-refresh.png",
    shopUpgrade: "/images/ui/kepi_icon-upgrade-population.png",
    shop: "/images/ui/kepi_icon-shop.png",
    back: "/images/ui/kepi_icon-back.png",
    textures: {
      frameWood: "/images/ui/kepi_ui_frame-wood.png",
      paperCream: "/images/ui/kepi_ui_paper-cream.png",
      paperLetterEdge: "/images/ui/kepi_ui_paper-letter-edge.png",
      hudTag: "/images/ui/kepi_ui_hud-tag.png",
      shopSlot: "/images/ui/kepi_ui_shop-slot.png",
      buttonNormal: "/images/ui/kepi_ui_button-wood-normal.png",
      buttonHover: "/images/ui/kepi_ui_button-wood-hover.png",
      buttonDisabled: "/images/ui/kepi_ui_button-wood-disabled.png",
      dividerWood: "/images/ui/kepi_ui_divider-wood.png",
      vignetteWarm: "/images/ui/kepi_ui_vignette-warm.png",
    },
  },

  ending: {
    letterFrame: "/images/ending/kepi_envelope-frame.png",
    letterScatter: "/images/ending/kepi_wind-scatter-letters.png",
    bulletTime: "/images/ending/kepi_bullet-time-highlight.png",
    gestureHint: "/images/ui/kepi_ending-gesture.png",
  },

  effects: {
    mist: "/images/effects/kepi_effect-mist-particles.png",
    attack: "/images/effects/kepi_effect-forgotten-attack.png",
    homeRepair: "/images/effects/kepi_effect-home-repair.png",
    starUp: "/images/effects/kepi_effect-star-up.png",
    shopRefresh: "/images/effects/kepi_effect-shop-refresh.png",
    letterPickup: "/images/effects/kepi_effect-shuike-letter-pickup.png",
  },

  audio: {
    bgmMain: "/audio/bgm/kepi_main-loop.mp3",
    sfxBuy: "/audio/sfx/kepi_buy.mp3",
    sfxRefresh: "/audio/sfx/kepi_refresh.mp3",
    sfxStarUp: "/audio/sfx/kepi_star-up.mp3",
    sfxCollectLetter: "/audio/sfx/kepi_collect-letter.mp3",
    sfxRepairHome: "/audio/sfx/kepi_repair-home.mp3",
    sfxWin: "/audio/sfx/kepi_win.mp3",
    sfxLose: "/audio/sfx/kepi_lose.mp3",
    sfxEndingWave: "/audio/sfx/kepi_ending-wave.mp3",
    voiceYeHeren: "/audio/voice/kepi_letter-ye-heren.mp3",
  },
} as const;

/** Maps engine enemy type ids to asset manifest keys / file slugs. */
export const ENEMY_ASSET_ID_MAP = {
  qianhaibei: "qianhai-stele",
  luyinguanli: "luyin-clerk",
  zhuzaiqi: "zhuzai-contract",
  ehushan: "ehu-mountain",
  hongtouchuan: "redhead-ship",
  xiedouhuo: "melee-fire",
} as const;
