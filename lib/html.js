SetDocTitle = function(title) {
    DocHead.addMeta({
        name: "apple-mobile-web-app-title",
        content: title,
    });
    DocHead.setTitle(title);
}

SetTouchIconDefault = function() {
    DocHead.addLink({rel:  "apple-touch-icon",                      href:"/favicon/apple-icon.png"});
    DocHead.addLink({rel:  "apple-touch-icon", sizes:"76x76",       href:"/favicon/apple-icon-76x76.png"});
    DocHead.addLink({rel:  "apple-touch-icon", sizes:"120x120",     href:"/favicon/apple-icon-120x120.png"});
    DocHead.addLink({rel:  "apple-touch-icon", sizes:"152x152",     href:"/favicon/apple-icon-152x152.png"});
}