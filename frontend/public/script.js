$(document).ready(function(){
    $("#addNote").click(function(){
        $("#addNoteForm").show();
    });
    $("#shareNote").click(function(){
        $("#shareNoteForm").show();
        var id = $(this).siblings("span").text();
        $("#hiddenId").val(id);
    });
});