$(document).ready(function(){
    $("#addNote").click(function(){
        $("#addNoteForm").toggle();
    });
    $(".shareNote").click(function(){
        $("#shareNoteForm").show();
        var id = $(this).siblings("span").text();
        $("#hiddenId").val(id);
    });
    $("#generatePreview").click(function(){
        $("iframe").attr("srcdoc",$("#noteContent").val());
    });
});