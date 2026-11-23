export type PortalCommittee = {
  id: string;
  code: string;
  name: string;
  topics: string[];
  delegations: { id: string; name: string }[];
  resolutions: { id: string; label: string }[];
};
