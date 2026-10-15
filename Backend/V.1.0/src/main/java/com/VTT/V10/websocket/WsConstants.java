package com.VTT.V10.websocket;

/**
 * Centralized constant definitions for STOMP destinations, subscriptions, actions, and permission keys.
 */
public final class WsConstants {

    private WsConstants() {
        // Prevent instantiation
    }

    // Subscribe Topics
    public static final String TOPIC_ROOM_PREFIX    = "/topic/room/";
    public static final String TOPIC_USERS_SUFFIX    = "/users";
    public static final String TOPIC_SETTINGS_SUFFIX = "/settings";

    // Application Inbound Destinations
    public static final String APP_TOKEN_MOVE          = "/room/{roomId}/token/move";
    public static final String APP_DRAWING             = "/room/{roomId}/drawing";
    public static final String APP_DRAWING_DELETE      = "/room/{roomId}/drawing/delete";
    public static final String APP_FOG                 = "/room/{roomId}/fog";
    public static final String APP_FOG_GLOBAL_REVEAL   = "/room/{roomId}/fog/global-reveal";
    public static final String APP_EVENT               = "/room/{roomId}/event";
    public static final String APP_CONDITIONS          = "/room/{roomId}/conditions";
    public static final String APP_ROLE_TITLE          = "/room/{roomId}/role-title";
    public static final String APP_DICE                = "/room/{roomId}/dice";
    public static final String APP_SETTINGS            = "/room/{roomId}/settings";
    public static final String APP_PRESENCE_JOIN       = "/room/{roomId}/presence/join";
    public static final String APP_PRESENCE_LEAVE      = "/room/{roomId}/presence/leave";

    // Actions
    public static final String ACTION_MOVE   = "MOVE";
    public static final String ACTION_ADD    = "ADD";
    public static final String ACTION_DELETE = "DELETE";
    public static final String ACTION_UPDATE = "UPDATE";

    // Roles
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_HOST  = "HOST";

    // Permissions
    public static final String PERM_DRAWING    = "DRAWING";
    public static final String PERM_TEXT       = "TEXT";
    public static final String PERM_FOG        = "FOG";
    public static final String PERM_SCENE      = "SCENE";
    public static final String PERM_ASSETS     = "ASSETS";
    public static final String PERM_EDIT_TOKEN = "EDIT_TOKEN";
}