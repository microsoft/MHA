import "../../Content/Office.css";
import "../../Content/privacy.css";

// Initialize privacy policy page
document.addEventListener("DOMContentLoaded", () => {
    const closeButton = document.getElementById("close-button");

    // Function to handle closing/going back
    const handleClose = () => {
        // Try to go back to the previous page first
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // If no history, try to close the window/tab
            window.close();

            // If window.close() doesn't work (some browsers prevent it),
            // navigate back to the main add-in page
            setTimeout(() => {
                window.location.href = "uitoggle.html";
            }, 100);
        }
    };

    // Handle close button click
    if (closeButton) {
        closeButton.addEventListener("click", handleClose);
    }

    // Handle Escape key press
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            handleClose();
        }
    });
});
