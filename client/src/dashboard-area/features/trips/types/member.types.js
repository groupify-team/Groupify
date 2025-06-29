// types/member.types.js
export const MemberTypes = {
  Member: {
    uid: "string",
    displayName: "string",
    email: "string",
    photoURL: "string",
  },

  MemberRole: {
    role: "string", // creator, admin, member
    label: "string", // Creator, Admin, Member
    color: "string", // purple, blue, gray
    icon: "string", // CrownIcon, ShieldCheckIcon, UserIcon
    canPromote: "boolean",
    canDemote: "boolean",
    canRemove: "boolean",
  },
};
