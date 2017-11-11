/* This file is part of Jeedom.
 *
 * Jeedom is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Jeedom is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Jeedom. If not, see <http://www.gnu.org/licenses/>.
 */

//$('#bt_healthxee').on('click', function () {
//    $('#md_modal').dialog({title: "{{Santé Xee}}"});
//    $('#md_modal').load('index.php?v=d&plugin=xee&modal=health').dialog('open');
//});

$("#table_cmd").sortable({
    axis: "y",
    cursor: "move",
    items: ".cmd",
    placeholder: "ui-state-highlight",
    tolerance: "intersect",
    forcePlaceholderSize: true
});

function addCmdToTable(_cmd) {
    if (!isset(_cmd)) {
        var _cmd = {
            configuration: {}
        };
    }
    var tr = '<tr class="cmd" data-cmd_id="' + init(_cmd.id) + '">';
    tr += '<td>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="id" style="display : none;">';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="name"></td>';
    tr += '<td>';
    tr += '<span><label class="checkbox-inline"><input type="checkbox" class="cmdAttr checkbox-inline" data-l1key="isHistorized" checked/>{{Historiser}}</label></span> ';
    tr += '</td>';
    tr += '<td>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="type" style="display : none;">';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="subType" style="display : none;">';
    if (is_numeric(_cmd.id)) {
        tr += '<a class="btn btn-default btn-xs cmdAction expertModeVisible" data-action="configure"><i class="fa fa-cogs"></i></a> ';
        tr += '<a class="btn btn-default btn-xs cmdAction" data-action="test"><i class="fa fa-rss"></i> {{Tester}}</a>';
    }
    tr += '<i class="fa fa-minus-circle pull-right cmdAction cursor" data-action="remove"></i></td>';
    tr += '</tr>';
    $('#table_cmd tbody').append(tr);
    $('#table_cmd tbody tr:last').setValues(_cmd, '.cmdAttr');
    jeedom.cmd.changeType($('#table_cmd tbody tr:last'), init(_cmd.subType));
}

function printEqLogic() {
    $('#table_sound tbody').empty();
    if (listSound && listSound.length > 2) {
        listSound.split(';').map(function (soundSelect) {
            var soundTab = soundSelect.split("|");
            addSoundToTable({
                id: soundTab[0],
                label: soundTab[1]
            })
        });
    }
}

function addSoundToTable(sound) {
    var tr = '<tr>';
    tr += '<td><audio controls preload="none"><source src="plugins/gcast/sound/' + sound.id + '.mp3" type="audio/mpeg" preload="none"></audio>' + sound.label + ' </td>';
    tr += '<td><a class="btn btn-default btn-xs soundAction" data-snd_id="' + sound.id + '" data-action="remove">Supprimer <i class="fa fa-minus-circle"></i></a></td>';
    tr += '</tr>';
    $('#table_sound tbody').append(tr);
}

$('.soundAction').live('click', function () {
    var snd_id = $(this).data('snd_id');
    var action = $(this).data('action');
    console.log(snd_id, action);
    if (action == 'remove') {
        removeSound(snd_id);
    }
});

function removeSound(snd_id) {
    $.ajax({ // fonction permettant de faire de l'ajax
        type: "POST", // methode de transmission des données au fichier php
        url: 'plugins/gcast/core/ajax/gcast.ajax.php?jeedom_token=' +ajaxToken,
        data: {
            action: "removeSound",
            snd_id: snd_id
        },
        dataType: 'json',
        error: function (request, status, error) {
            handleAjaxError(request, status, error);
        },
        success: function (data) { // si l'appel a bien fonctionné
            if(data.state != 'ok'){
                $('#div_alert').showAlert({message: data.result, level: 'danger'});
                return;
            }else{
                listSound = data.result;
                printEqLogic();
            }
            //if (data.state != 'ok') {
            //$('#div_alert').showAlert({message:  data.result,level: 'danger'});
            //    return;
            // }
        }
    });
}

function addSound(fd) {
    fd.append('action', 'addSound');
    $.showLoading();
    $.ajax({ // fonction permettant de faire de l'ajax
        type: "POST", // methode de transmission des données au fichier php
        url: 'plugins/gcast/core/ajax/gcast.ajax.php?action=addSound&jeedom_token=' +ajaxToken,
        //data: {
        //    action: "addSound"
        //},
        dataType: 'json',
        data: fd,
        processData: false,
        contentType: false,
        error: function (request, status, error) {
            $.hideLoading();
            handleAjaxError(request, status, error);
        },
        success: function (data) { // si l'appel a bien fonctionné
            $.hideLoading();
            console.log(data);
            if(data.state != 'ok'){
                $('#div_alert').showAlert({message: data.result, level: 'danger'});
                return;
            }else{
                listSound = data.result;
                printEqLogic();
            }
            //if (data.state != 'ok') {
            //$('#div_alert').showAlert({message:  data.result,level: 'danger'});
            //    return;
            // }
        }
    });
}
$('#soundRecord').on('click', function (event) {
    var action = $(this).data('action');
    if(action=='record'){
        if (typeof MediaRecorder === 'undefined' || !navigator.getUserMedia) {
            bootbox.alert('Sorry! This requires Firefox 30 and up or Chrome 47 and up.');
        } else {
            navigator.getUserMedia({"audio": true}
            ,startRecording
            , function(err) {
                bootbox.alert('Only work on https access with permission');
                console.log('The following gUM error occured: ', err);
            });
        }
    }else if(action=='stop' && mediaRecorder){
        mediaRecorder.stop();
        $(this).html('Enregistrer <i class="fa fa-microphone"></i>');
        $(this).data('action','record');
    }
});
$('#soundFile').on('change', function (event) {
    let upFile = $("#soundFile")[0].files[0];
    console.log(upFile);
    bootbox.prompt({title:"{{Nom du son ?}}",value:upFile.name, callback:function (result) {
        if (result !== null) {
            var fd = new FormData();
            fd.append('fdata',upFile,result);
            addSound(fd);
        }
    }});
});

var mediaRecorder;
var chunks = [];
function startRecording(stream) {
    console.log('Starting...');
    $('#soundRecord').html('<i class="fa fa-stop" style="color:#963834"></i> Stop');
    $('#soundRecord').data('action','stop');
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    //var url = window.URL || window.webkitURL;
    //audioElement.src = url ? url.createObjectURL(stream) : stream;
    //audioElement.play();
    mediaRecorder.ondataavailable = function (e) {
        //log('Data available...');
        //console.log(e.data);
        //console.log(e);
        chunks.push(e.data);
    };
    mediaRecorder.onerror = function (e) {
        console.error('Error: ' + e);
    };
    mediaRecorder.onstart = function () {
        console.log('Started, state = ' + mediaRecorder.state);
    };
    mediaRecorder.onstop = function () {
        console.log('Stopped, state = ' + mediaRecorder.state);

        var blob = new Blob(chunks, {
            type: 'audio/ogg; codecs=opus' 
        });
        chunks = [];

        var audioURL = window.URL.createObjectURL(blob);

        bootbox.prompt("{{Nom du son ?}}", function (result) {
            if (result !== null) {
                var fd = new FormData();
                //fd.append('fname', 'test.ogg');
                fd.append('fdata', blob,result);
                addSound(fd);
            }
        });

        //downloadLink.href = audioURL;
        //audioElement.src = audioURL;
    };
    mediaRecorder.onwarning = function (e) {
        console.log('Warning: ' + e);
    };
}