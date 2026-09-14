import type Ionicons from "@expo/vector-icons/Ionicons";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export interface CommunityGuideline {
  icon: IoniconName;
  title: string;
  detail: string;
}

/**
 * Rules every resident forum post is checked against during admin review.
 * Shared by the resident composer notice and the guidelines modal.
 */
export const COMMUNITY_GUIDELINES: CommunityGuideline[] = [
  {
    icon: "happy-outline",
    title: "Be respectful",
    detail:
      "No abusive, threatening, or discriminatory language towards neighbours, staff, or the authority.",
  },
  {
    icon: "location-outline",
    title: "Keep it about the community",
    detail:
      "Post about neighbourhood matters — services, safety, events, and shared spaces.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Protect privacy",
    detail:
      "Do not share anyone's phone number, address, or personal details without their consent.",
  },
  {
    icon: "checkmark-circle-outline",
    title: "Be accurate",
    detail:
      "Share what you know to be true. Rumours and unverified claims will not be approved.",
  },
  {
    icon: "megaphone-outline",
    title: "No spam or advertising",
    detail:
      "Avoid promotions, repeated posts, and anything unrelated to the community.",
  },
  {
    icon: "construct-outline",
    title: "Report issues as complaints",
    detail:
      "Maintenance problems belong in Complaints so they can be tracked and assigned.",
  },
];

export const COMMUNITY_GUIDELINES_SUMMARY =
  "Every resident post is checked by an admin against the Community Guidelines before it appears in the forum.";
