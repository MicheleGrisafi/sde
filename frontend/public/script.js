$(document).ready(function(){
    $("#addNote").click(function(){
        $("#addNoteForm").toggle();
    });
    $(".shareNote").click(function(){
        alert("Share");
        $("#shareNoteForm").show();
        var id = $(this).siblings("span").text();
        $("#hiddenId").val(id);
    });
    $("#generatePreview").click(function(){
        $("iframe").attr("srcdoc",$("#noteContent").val());
    });
});