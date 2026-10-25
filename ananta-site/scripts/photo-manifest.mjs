/**
 * Which source photo becomes which treated asset.
 *
 * Processing concerns only - the captions and alt text live in
 * content/photos.ts, keyed by the same slug.
 *
 * photos/01_campus_valley.jpg and 02_night_trail_of_lights.jpg are deliberately
 * absent: they are Wikimedia CC BY-SA and would require visible attribution.
 * Neither is on the caption list. See assets/CREDITS.md.
 */
export const PHOTOS = [
  // slug                  source file                            tone      aspect
  {
    slug: 'sangam-launch',
    src: '03_sangam_launch_hands_up.jpg',
    tone: 'ink',
    aspect: 4 / 3,
  },
  {
    slug: 'pyverse-hands',
    src: '04_pyverse_hands_on_laptop.jpg',
    tone: 'saffron',
    aspect: 3 / 4,
  },
  {
    slug: 'ai-stack',
    src: '05_codeclub_ai_stack_whiteboard.jpg',
    tone: 'ink',
    aspect: 4 / 3,
  },
  {
    slug: 'sangam-launch-stage',
    src: '08_sangam_on_screen.jpg',
    tone: 'navy',
    aspect: 3 / 4,
  },
  { slug: 'battle-code', src: '10_codeclub_team.jpg', tone: 'saffron', aspect: 4 / 3 },
  { slug: 'pyverse-group', src: '11_pyverse_group.jpg', tone: 'ink', aspect: 4 / 3 },
  { slug: 'sih-demo', src: '12_hackathon_demo.jpg', tone: 'navy', aspect: 3 / 2 },
  { slug: 'sih-team', src: '13_hackathon_team.jpg', tone: 'ink', aspect: 4 / 3 },
  {
    slug: 'ekatva',
    src: '14_winners_with_certificates.jpg',
    tone: 'saffron',
    aspect: 4 / 3,
  },

  // --- /glimpses: club events, from the SANGAM deck (25 Sept 2026) ---------
  { slug: 'imc-2024', src: '20_devgrowth_imc_2024.jpg', tone: 'navy', aspect: 3 / 2 },
  { slug: 'ibs-2024', src: '21_ibs_2024_hall.jpg', tone: 'ink', aspect: 3 / 2 },
  {
    slug: 'udyamitsav-26-win',
    src: '22_udyamitsav26_cxo_win.jpg',
    tone: 'saffron',
    aspect: 3 / 2,
  },
  {
    slug: 'udyamitsav-25',
    src: '23_udyamitsav25_stage.jpg',
    tone: 'ink',
    aspect: 3 / 2,
  },
  {
    slug: 'codeforge-25',
    src: '24_codeforge_smvdu25_prize.jpg',
    tone: 'saffron',
    aspect: 4 / 3,
  },
  {
    slug: 'avalanche-25',
    src: '25_devgrowth_avalanche_2025.jpg',
    tone: 'navy',
    aspect: 4 / 3,
  },
  {
    slug: 'linux-git-26',
    src: '26_devgrowth_linux_git_2026.jpg',
    tone: 'ink',
    aspect: 4 / 3,
  },
  { slug: 'java-25', src: '27_devgrowth_java_2025.jpg', tone: 'saffron', aspect: 4 / 3 },
  {
    slug: 'devgrowth-workshop',
    src: '28_devgrowth_workshop.jpg',
    tone: 'ink',
    aspect: 4 / 3,
  },
  {
    slug: 'codeclub-session',
    src: '29_codeclub_session.jpg',
    tone: 'navy',
    aspect: 4 / 3,
  },
  {
    slug: 'null-ethical-hacking',
    src: '30_null_ethical_hacking.jpg',
    tone: 'ink',
    aspect: 3 / 2,
  },
  { slug: 'null-ctf', src: '31_null_ctf.jpg', tone: 'navy', aspect: 4 / 3 },
  { slug: 'null-workshop', src: '32_null_workshop.jpg', tone: 'saffron', aspect: 4 / 3 },
  {
    slug: 'aiml-awareness',
    src: '33_aiml_awareness.jpg',
    tone: 'ink',
    aspect: 16 / 9,
  },
  {
    slug: 'aiml-hackaithon',
    src: '34_aiml_hackaithon.jpg',
    tone: 'saffron',
    aspect: 4 / 3,
  },
];

/**
 * One treated master per photo. The xerox and the tear are baked in here;
 * responsive resizing and format negotiation are next/image's job, so there is
 * no point emitting a size ladder by hand.
 */
export const MASTER_WIDTH = 1200;
