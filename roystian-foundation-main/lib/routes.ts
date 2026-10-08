/**
 * Routes that open with a full-bleed photographic hero.
 *
 * The navbar reads this to stay transparent over the image until the reader
 * scrolls, and the pages themselves pass `bleed` to <SiteShell> so the hero
 * starts at the very top of the viewport. Keep the two in step.
 */
const BLEED_ROUTES = [
  "/",
  "/programs",
  "/domains",
  "/how-it-works",
  "/colleges",
  "/college-internships",
  "/about",
  "/pehlachance",
  "/verify",
  "/internships",
] as const;

export function isBleedRoute(pathname: string): boolean {
  return BLEED_ROUTES.some(
    (route) =>
      pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
  );
}
