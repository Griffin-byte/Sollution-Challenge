// ✅ Firebase Configuration
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

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let bannedWords = [];

// ✅ Load Banned Words Safely
fetch("words.json")
  .then(response => response.json())
  .then(data => {
    bannedWords = data.bannedWords;
    console.log("✅ Banned Words Loaded:", bannedWords);
  })
  .catch(error => {
    console.error("🔥 Error loading banned words:", error);
    alert("⚠️ Could not load banned words list. Please refresh and try again!");
  });

 

// ✅ Add Event Listeners Safely
document.addEventListener("DOMContentLoaded", () => {
    const postButton = document.getElementById("postButton");
    const saveNicknameBtn = document.getElementById("saveNicknameBtn");

    if (postButton) postButton.addEventListener("click", addPost);
    if (saveNicknameBtn) saveNicknameBtn.addEventListener("click", saveNickname);
});

let currentUser;

// ✅ Firebase Authentication
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        console.log("✅ User signed in:", user.uid);
        checkFirebaseForNickname();
    } else {
        console.log("❌ User signed out. Signing in anonymously...");
        firebase.auth().signInAnonymously()
            .then(userCredential => {
                currentUser = userCredential.user;
                console.log("✅ Anonymous user signed in:", currentUser.uid);
                checkFirebaseForNickname();
            })
            .catch(error => console.error("🔥 Firebase Auth Error:", error));
    }
});

function checkFirebaseForNickname() {
    if (!currentUser) return;
    
    db.ref("users/" + currentUser.uid).once("value").then(snapshot => {
        if (snapshot.exists() && snapshot.val().nickname) {
            const nickname = snapshot.val().nickname;
            localStorage.setItem("nickname", nickname);
            hideNicknamePopup();
            loadUserPosts();
            loadAllPosts();
        } else {
            showNicknamePopup();
        }
    }).catch(error => console.error("🔥 Firebase DB Error:", error));
}

function showNicknamePopup() {
    document.getElementById("nicknamePopup").style.display = "flex";
}

function hideNicknamePopup() {
    document.getElementById("nicknamePopup").style.display = "none";
}

function saveNickname() {
    const nickname = document.getElementById("nicknameInput").value.trim();

    if (!nickname) {
        alert("⚠️ Please enter a nickname.");
        return;
    }

    db.ref("users/" + currentUser.uid).set({ nickname })
        .then(() => {
            localStorage.setItem("nickname", nickname);
            hideNicknamePopup();
            loadUserPosts();
            loadAllPosts();
        })
        .catch(error => {
            alert("❌ Failed to save nickname.");
        });
}

// // ✅ Check for Banned Words Safely
// function containsBannedWords(text) {
//     if (!bannedWords || bannedWords.length === 0) {
//         console.warn("⚠️ Warning: Banned words not loaded yet!");
//         return false;  // अगर लोड नहीं हुआ है, तो false करें
//     }
    
//     return bannedWords.some(word => text.toLowerCase().includes(word.toLowerCase()));
// }


function loadUserPosts() {
    if (!currentUser) return;
    console.log("Loading user posts...");

    db.ref("posts").orderByChild("userId").equalTo(currentUser.uid).on("value", snapshot => {
        console.log("User posts loaded:", snapshot.val());
    });
}

function containsBannedWords(text) {
    const lowerText = text.toLowerCase();
    const foundWords = [];

    for (const word of bannedWords) {
        if (lowerText.includes(word.toLowerCase())) {
            foundWords.push(word);
        }
    }

    // Return the array (not true/false)
    return foundWords;
}


function addPost() {
    const text = document.getElementById("postText").value.trim();
    if (!text) return alert("⚠️ Please enter some text!");

    if (!bannedWords || bannedWords.length === 0) {
        alert("⚠️ Banned words list is not loaded yet. Please try again later!");
        return;
    }

    const foundWords = containsBannedWords(text);
    if (foundWords.length > 0) {
        return alert(`❌ Your post contains these inappropriate words:\n\n"${foundWords.join('", "')}"\n\nPlease remove them.`);
    }

    const postId = db.ref("posts").push().key;
    const postData = {
        id: postId,
        text,
        userId: currentUser.uid,
        likes: 0,
        timestamp: Date.now()
    };

    db.ref("posts/" + postId).set(postData);
    document.getElementById("postText").value = "";
}

// ✅ Load All Posts
// ✅ सभी पोस्ट लोड करें
function loadAllPosts() {
    db.ref("posts").orderByChild("timestamp").on("value", snapshot => {
        const allPosts = document.getElementById("allPosts");
        allPosts.innerHTML = "";

        snapshot.forEach(child => {
            const post = child.val();
            db.ref("users/" + post.userId).once("value").then(userSnap => {
                const nickname = userSnap.val()?.nickname || "Anonymous";
                const initials = nickname.charAt(0).toUpperCase();

                allPosts.innerHTML += `
                    <div class='post' id='post-${post.id}'>
                        <div class='avatar'>${initials}</div>
                        <div class='post-content'>
                            <strong>${nickname}:</strong> ${post.text}
                            <br>
                            <button class="like-btn" onclick="toggleLike('${post.id}')">❤️(<span id='like-${post.id}'>${post.likes}</span>)</button>
                            <button class="comment-btn" onclick="showCommentBox('${post.id}')">💬</button>
                            <button class="share-btn" onclick="sharePost('${post.id}')">🔗</button>
                            
                            <!-- Comments Section -->
                            <div id='comments-${post.id}' class='comments-section'></div> 

                            <div id='commentBox-${post.id}' style='display:none; margin-top: 5px;'>
                                <input type='text' id='commentInput-${post.id}' placeholder='Write a comment...' style='width: 80%; padding: 5px;'>
                                <button class="comment-btn" onclick="addComment('${post.id}')">Post</button>
                            </div>
                        </div>
                    </div>`;

                // ✅ Load comments after post is rendered
                setTimeout(() => {
                    loadComments(post.id);
                }, 100);
            });
        });
    });
}

// ✅ Function to Share Post
window.sharePost = function(postId) {
    const postLink = window.location.href + `#post-${postId}`;
    navigator.clipboard.writeText(postLink).then(() => {
        alert("📋 Post link copied to clipboard! Share it with your friends.");
    });
};



// ✅ Show Comment Box for a Specific Post
window.showCommentBox = function(postId) {
    const commentBox = document.getElementById(`commentBox-${postId}`);
    if (commentBox) {
        commentBox.style.display = "block";
    } else {
        console.error(`❌ Comment box not found for post: ${postId}`);
    }
};

window.showYourPosts = function() {
    const yourPostsDiv = document.getElementById("yourPostsContainer");

    if (yourPostsDiv) {
        yourPostsDiv.style.display = "block"; // Show the div
        yourPostsDiv.style.margin = "auto";
    } else {
        console.error("❌ Element with ID 'yourPostsContainer' not found!");
    }
};

// Hide when clicked outside
window.onclick = function(event) {
    let modal = document.getElementById("yourPostsContainer");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

/// Function to Show Modal
function showYourPosts() {
    document.getElementById("yourPostsContainer").style.display = "block";
    document.body.classList.add("modal-open"); // Blur Background
}

// Close Modal on Outside Click
window.onclick = function(event) {
    let modal = document.getElementById("yourPostsContainer");
    if (event.target === modal) {
        modal.style.display = "none";
        document.body.classList.remove("modal-open"); // Remove Blur
    }
};

// Close Button Functionality
document.querySelector(".close-btn").addEventListener("click", function() {
    document.getElementById("yourPostsContainer").style.display = "none";
    document.body.classList.remove("modal-open"); // Remove Blur
});

window.onload = function () {
    document.querySelector(".guidelines-btn").addEventListener("click", function () {
        let content = document.getElementById("guidelinesContent");
        this.classList.toggle("active");
        content.style.display = content.style.display === "block" ? "none" : "block";
    });
};




// ✅ Add a Comment
// function containsBannedWords(comment) {
//     for (let word of bannedWords) {
//         let regex = new RegExp(`\\b${word}\\b`, "i"); // Case insensitive match
//         if (regex.test(comment)) {
//             return true; // If banned word found
//         }
//     }
//     return false;
// }

window.addComment = function(postId) {
    const commentInput = document.getElementById(`commentInput-${postId}`);
    if (!commentInput) return console.error("❌ Comment input field not found.");

    const commentText = commentInput.value.trim();
    if (!commentText) return alert("⚠️ Please enter a comment!");

    // Check for banned words
    if (containsBannedWords(commentText)) {
        return alert("❌ Your comment contains inappropriate words!");
    }

    const commentId = db.ref(`comments/${postId}`).push().key;
    const commentData = {
        id: commentId,
        userId: currentUser.uid,
        text: commentText,
        timestamp: Date.now()
    };

    db.ref(`comments/${postId}/${commentId}`).set(commentData)
        .then(() => {
            commentInput.value = "";
            loadComments(postId);  // Reload comments after adding
        })
        .catch(error => console.error("🔥 Error adding comment:", error));
};

// ✅ Load Comments for a Post
// ✅ Load Comments for Each Post on Page Load
function loadComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (!commentsSection) return console.error(`❌ Comments section not found for post: ${postId}`);

    db.ref(`comments/${postId}`).orderByChild("timestamp").on("value", snapshot => {
        commentsSection.innerHTML = ""; // Clear previous comments before loading new ones

        if (!snapshot.exists()) {
            commentsSection.innerHTML = "<p>No comments yet. Be the first to comment!</p>";
            return;
        }

        snapshot.forEach(child => {
            const comment = child.val();
            db.ref(`users/${comment.userId}`).once("value").then(userSnap => {
                const nickname = userSnap.val()?.nickname || "Anonymous";
                commentsSection.innerHTML += `<div class='comment'><strong>${nickname}:</strong> ${comment.text}</div>`;
            });
        });
    }, error => console.error("🔥 Error loading comments:", error));
}

// ✅ Automatically Load Comments for Each Post
window.onload = function () {
    db.ref("posts").once("value", snapshot => {
        snapshot.forEach(post => {
            loadComments(post.key);  // Load comments for each post on page refresh
        });
    });
};





window.toggleLike = function(postId) {
    const userId = currentUser?.uid;
    if (!userId) return alert("⚠️ Please sign in to like posts!");

    const likeRef = db.ref(`likes/${postId}/${userId}`);
    const postLikeRef = db.ref(`posts/${postId}/likes`);

    likeRef.once("value").then(snapshot => {
        if (snapshot.exists()) {
            // 🔽 Unlike: Remove like from database and decrease count
            likeRef.remove().then(() => {
                postLikeRef.transaction(currentLikes => {
                    return (currentLikes > 0) ? currentLikes - 1 : 0; // Ensure count doesn't go negative
                }).then(() => updateLikeUI(postId));
            });
        } else {
            // 🔼 Like: Add like to database and increase count
            likeRef.set(true).then(() => {
                postLikeRef.transaction(currentLikes => {
                    return (currentLikes || 0) + 1;
                }).then(() => updateLikeUI(postId));
            });
        }
    }).catch(error => console.error("🔥 Error toggling like:", error));
};

// ✅ Update the Like Count in UI
function updateLikeUI(postId) {
    const likeCountSpan = document.getElementById(`like-${postId}`);
    db.ref(`posts/${postId}/likes`).once("value").then(snapshot => {
        if (likeCountSpan) {
            likeCountSpan.innerText = snapshot.val() || 0;
 
        }
    });
}

// ✅ Logout Function
function logout() {
    firebase.auth().signOut().then(() => {
        localStorage.removeItem("nickname");
        location.reload();
    });
}

console.log("✅ Script loaded successfully!");


