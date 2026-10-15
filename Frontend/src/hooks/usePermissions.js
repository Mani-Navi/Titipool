import { useMemo, useCallback } from "react";
import { useAuthStore } from "../stores/auth.store";
import { useRoomStore } from "../stores/room.store";
import { ROLES } from "../constants/roles.js";

const EMPTY_ROOMS = Object.freeze([]);

export function usePermissions(roomData) {
  const user = useAuthStore((state) => state.user);
  const storeRoom = useRoomStore((state) => state.currentRoom || state.room || state.activeRoom);
  const roomsList = useRoomStore((state) => state.rooms) || EMPTY_ROOMS;

  const currentRoom = useMemo(() => {
    return (
        roomData ||
        storeRoom ||
        (roomData?.id ? roomsList.find((r) => r.id === roomData.id) : null) ||
        roomsList[0] ||
        null
    );
  }, [roomData, storeRoom, roomsList]);

  const currentUserId = useMemo(() => {
    const id = user?.id || user?.userId;
    return id ? String(id).trim().toLowerCase() : "";
  }, [user]);

  const currentUsername = useMemo(() => {
    const uname = user?.username;
    return uname ? String(uname).trim().toLowerCase() : "";
  }, [user]);

  const currentUserEmail = useMemo(() => {
    const email = user?.email;
    return email ? String(email).trim().toLowerCase() : "";
  }, [user]);

  const isOwnerByRoom = useMemo(() => {
    if (!currentRoom) return false;

    const hasExplicitOwnership = currentRoom.is_owner === true || currentRoom.isOwner === true;
    const hasUsernameMatch = Boolean(
        currentUsername &&
        currentRoom.ownerUsername &&
        String(currentRoom.ownerUsername).trim().toLowerCase() === currentUsername
    );
    const hasIdMatch = Boolean(
        currentUserId &&
        currentRoom.ownerId &&
        String(currentRoom.ownerId).trim().toLowerCase() === currentUserId
    );
    const hasCreatorMatch = Boolean(
        currentUserId &&
        currentRoom.creatorId &&
        String(currentRoom.creatorId).trim().toLowerCase() === currentUserId
    );

    return Boolean(hasExplicitOwnership || hasUsernameMatch || hasIdMatch || hasCreatorMatch);
  }, [currentRoom, currentUsername, currentUserId]);

  const isRoleGM = useMemo(() => {
    return Boolean(
        (currentRoom?.role && (currentRoom.role === "GM" || currentRoom.role === "ADMIN")) ||
        (user?.role && (user.role === "GM" || user.role === "ADMIN"))
    );
  }, [currentRoom?.role, user?.role]);

  const isMemberGM = useMemo(() => {
    if (!currentRoom?.members || (!currentUserId && !currentUsername)) return false;
    return currentRoom.members.some((m) => {
      const mUid = String(m.user?.id || m.userId || m.id || "").trim().toLowerCase();
      const mUname = String(m.user?.username || m.username || "").trim().toLowerCase();

      const isMe =
          Boolean(currentUserId && mUid && mUid === currentUserId) ||
          Boolean(currentUsername && mUname && mUname === currentUsername);

      return isMe && (m.role === "ADMIN" || m.role === "GM");
    });
  }, [currentRoom?.members, currentUserId, currentUsername]);

  const isGM = Boolean(isOwnerByRoom || isRoleGM || isMemberGM);
  const currentRole = isGM ? ROLES.GM : ROLES.PLAYER;

  const rawPermissions = currentRoom?.permissions || {};

  const permissions = useMemo(() => {
    return {
      canAssets: isGM ? true : Boolean(rawPermissions.canAssets),
      canText: isGM ? true : Boolean(rawPermissions.canText),
      canFog: isGM ? true : Boolean(rawPermissions.canFog),
      canDrawing: isGM ? true : Boolean(rawPermissions.canDrawing),
      canScene: isGM ? true : Boolean(rawPermissions.canScene || rawPermissions.canMap),
      canMap: isGM ? true : Boolean(rawPermissions.canMap || rawPermissions.canScene),
      canRuler: isGM ? true : (rawPermissions.canRuler !== undefined ? Boolean(rawPermissions.canRuler) : true),
      canEditToken: isGM ? true : Boolean(rawPermissions.canEditToken),
    };
  }, [isGM, rawPermissions]);

  const hasPermission = useCallback(
      (permissionKey) => {
        if (isGM) return true;
        return Boolean(permissions[permissionKey]);
      },
      [isGM, permissions]
  );

  const canMoveToken = useCallback(
      (controlledBy) => {
        if (isGM) return true;
        if (!user || !controlledBy) return false;
        const cb = String(controlledBy).trim().toLowerCase();
        if (!cb) return false;

        return (
            (currentUserId && cb === currentUserId) ||
            (currentUsername && cb === currentUsername) ||
            (currentUserEmail && cb === currentUserEmail)
        );
      },
      [isGM, user, currentUserId, currentUsername, currentUserEmail]
  );

  return {
    currentRole,
    isGM,
    isPlayer: !isGM,
    permissions,
    hasPermission,
    canMoveToken,
    canEditMap: isGM || permissions.canMap,
    canManageFog: isGM || permissions.canFog,
    canDraw: isGM || permissions.canDrawing,
    canUseText: isGM || permissions.canText,
    canUseAssets: isGM || permissions.canAssets,
    canUseRuler: isGM || permissions.canRuler,
    canEditToken: isGM || permissions.canEditToken,
  };
}