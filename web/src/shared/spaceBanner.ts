export function spaceBannerFallbackUrl(bannerUrl: string): string {
  return bannerUrl.replace(/_org\.jpg(\?.*)?$/i, ".jpg$1");
}
