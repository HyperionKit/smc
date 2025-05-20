/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */

package com.projectbusinessmanagement.bizplatform;

import JFrame.LandingPage;
import org.mindrot.jbcrypt.BCrypt;
import java.util.HashMap;
import java.util.Map;
import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
/**
 *
 * @author TraderG
 */



public class BizPlatform {

    public static void main(String[] args) {
        // Ensure GUI creation happens on the Event Dispatch Thread
        javax.swing.SwingUtilities.invokeLater(() -> {
            LandingPage landingPage = new LandingPage(); // Create instance of LandingPage
            landingPage.setVisible(true); // Make the frame visible
        });
    }
    
    // User.java
public class User {
    private String name;
    private String email;
    private String encryptedPassword;
    private String role; // Admin, Manager, Employee

    public User(String name, String email, String encryptedPassword, String role) {
        this.name = name;
        this.email = email;
        this.encryptedPassword = encryptedPassword;
        this.role = role;
    }

    // Getters
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getEncryptedPassword() { return encryptedPassword; }
    public String getRole() { return role; }
}

// AuthService.java
    public class AuthService {
    private Map<String, User> users = new HashMap<>(); // Email -> User
    private User currentUser = null; // Track logged-in user

    // Register a new user with encrypted password
    public boolean register(String name, String email, String password, String role) {
        if (users.containsKey(email)) {
            return false; // Email already exists
        }
        String encryptedPassword = BCrypt.hashpw(password, BCrypt.gensalt());
        User user = new User(name, email, encryptedPassword, role);
        users.put(email, user);
        return true;
    }

    // Login with email and password
    public boolean login(String email, String password) {
        User user = users.get(email);
        if (user != null && BCrypt.checkpw(password, user.getEncryptedPassword())) {
            currentUser = user;
            return true;
        }
        return false;
    }

    // Logout
    public void logout() {
        currentUser = null;
    }

    // Get current user
    public User getCurrentUser() {
        return currentUser;
    }

    // Check if user has a specific role
    public boolean hasRole(String role) {
        return currentUser != null && currentUser.getRole().equals(role);
    }
    
    public class UserSession {
    private static String currentUserRole;
    private static String currentUsername;

    public static void setUser(String username, String role) {
        currentUsername = username;
        currentUserRole = role;
    }

    public static String getUserRole() {
        return currentUserRole;
    }

    public static String getUsername() {
        return currentUsername;
    }

    public static void clear() {
        currentUsername = null;
        currentUserRole = null;
    }
}
    }
}
