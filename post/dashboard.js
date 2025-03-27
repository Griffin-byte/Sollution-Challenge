import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getDatabase, ref, get, remove, set, update, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCAbopX7Km0fbSEFbqwoP0jtUEjkw2ed1g",
    authDomain: "electronic-care.firebaseapp.com",
    databaseURL: "https://electronic-care-default-rtdb.firebaseio.com",
    projectId: "electronic-care",
    storageBucket: "electronic-care.appspot.com",
    messagingSenderId: "450195296963",
    appId: "1:450195296963:web:103245bd30a256612f8876",
    measurementId: "G-S95FQJ3HKD"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

let currentUser, editingPostId = null;

// ✅ Load User Posts
function loadUserPosts() {
    const postContainer = document.getElementById("posts-container");
    if (!postContainer) {
        console.error("Element #posts-container not found!");
        return;
    }

    postContainer.innerHTML = ""; // Clear previous posts

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            
            // ✅ Pehle nickname fetch karna zaroori hai
            const userRef = ref(db, "users/" + user.uid);
            let username = "Unknown User";

            try {
                const userSnapshot = await get(userRef);
                if (userSnapshot.exists() && userSnapshot.val().nickname) {
                    username = userSnapshot.val().nickname;
                }
            } catch (error) {
                console.error("Error fetching user nickname:", error);
            }

            const userPostsRef = query(ref(db, "posts"), orderByChild("userId"), equalTo(user.uid));

            get(userPostsRef).then((snapshot) => {
                if (snapshot.exists()) {
                    snapshot.forEach((childSnapshot) => {
                        const post = childSnapshot.val();
                        const postId = childSnapshot.key;

                        const postElement = document.createElement("div");
                        postElement.classList.add("post-item");
                        postElement.innerHTML = `
                            <div class="post-content">
                                <p><strong>${username}</strong> <span class="timestamp">(${new Date(post.timestamp).toLocaleString()})</span></p>
                                <p id="post-text-${postId}">${post.text}</p>
                            </div>
                            <button onclick="openEditPostPopup('${postId}', '${post.text.replace(/'/g, "\\'")}')" class="edit-btn">Edit</button>
                            <button onclick="deletePost('${postId}')" class="delete-btn">Delete</button>
                        `;
                        postContainer.appendChild(postElement);
                    });
                } else {
                    postContainer.innerHTML = "<p>No posts found.</p>";
                }
            }).catch((error) => console.error("Error loading posts:", error));
        } else {
            console.error("User not authenticated!");
        }
    });
}


// ✅ Open Edit Nickname Popup
window.openEditNicknamePopup = function() {
    document.getElementById("editNicknameModal").style.display = "block";
};

// ✅ Close Edit Nickname Popup
window.closeEditNicknamePopup = function() {
    document.getElementById("editNicknameModal").style.display = "none";
};


// ✅ Open Post Edit Popup
window.openEditPostPopup = function(postId, currentText) {
    editingPostId = postId;
    document.getElementById("edit-post-content").value = currentText;
    document.getElementById("editPostModal").style.display = "block";
};

// ✅ Close Edit Popup
window.closeEditPostPopup = function() {
    document.getElementById("editPostModal").style.display = "none";
    editingPostId = null;
};

// ✅ Save Edited Post
window.saveEditedPost = function() {
    const newText = document.getElementById("edit-post-content").value.trim();
    const errorMsg = document.getElementById("post-error");

    // ✅ SQL Injection Protection (Block Special Characters)
    const validText = /^[a-zA-Z0-9\s.,!?()'"-]{1,300}$/;

    if (!validText.test(newText)) {
        errorMsg.textContent = "Invalid characters! Avoid symbols & code.";
        return;
    }

    // ✅ Update Firebase
    if (currentUser && editingPostId) {
        const postRef = ref(db, "posts/" + editingPostId);
        update(postRef, { text: newText }).then(() => {
            document.getElementById(`post-text-${editingPostId}`).textContent = newText;
            closeEditPostPopup();
        }).catch((error) => console.error("Error updating post:", error));
    }
};

// ✅ Delete Post
window.deletePost = function(postId) {
    if (confirm("Are you sure you want to delete this post?")) {
        remove(ref(db, "posts/" + postId))
            .then(() => {
                alert("Post deleted successfully!");
                loadUserPosts();
            })
            .catch((error) => console.error("Error deleting post:", error));
    }
};

// ✅ Load Posts on Page Load
document.addEventListener("DOMContentLoaded", () => {
    loadUserPosts();
});
