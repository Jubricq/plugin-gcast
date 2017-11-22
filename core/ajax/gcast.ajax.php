<?php

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

try {
    require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
    include_file('core', 'authentification', 'php');

    if (!isConnect('admin')) {
        throw new Exception(__('401 - Accès non autorisé', __FILE__));
    }
    
	ajax::init();
	$eqLogic_id = init('eqLogic_id');
	//$_FILES['fdata'];
	/*
		Le nom	$_FILES['avatar']['name']
		Le chemin du fichier temporaire	$_FILES['avatar']['tmp_name']
		La taille (peu fiable, dépend du navigateur)	$_FILES['avatar']['size']
		Le type MIME (peu fiable, dépend du navigateur)	$_FILES['avatar']['type']
		Un code d'erreur si besoin	$_FILES['avatar']['error']
	
    if ( 0 < $_FILES['fdata']['error'] ) {
        echo 'Error: ' . $_FILES['file']['error'] . '<br>';
    }
    else {
        move_uploaded_file($_FILES['file']['tmp_name'], 'uploads/' . $_FILES['file']['name']);
	}
	*/
    if (init('action') == 'addSound') {
		//$gcast = gcast::byId(init('id'));
		//if (!is_object($gcast)) {
		//	throw new Exception(__('Objet inconnu verifié l\'id : ', __FILE__) . init('id'));
		//}

		if(isset($_FILES['fdata']))
		{ 
			 log::add('gcast', 'debug','fdata name:'.$_FILES['fdata']['name'].' tmp_name:'.$_FILES['fdata']['tmp_name'].'   size:'.$_FILES['fdata']['size'].'   type:'.$_FILES['fdata']['type'].'   error:'.$_FILES['fdata']['error']);
			 if( (0 !== $_FILES['fdata']['error']) || ! is_uploaded_file($_FILES['fdata']['tmp_name']) ){
				throw new Exception(__('Echec de l\'upload', __FILE__));
			 }
			 if(strpos($_FILES['fdata']['type'],'audio')!==0){
				throw new Exception(__('Fichier audio uniquement', __FILE__));
			 }
			 $fileType= substr($_FILES['fdata']['type'],6);
			 if(strcmp($fileType, "ogg") === 0){
				//Do nothing
			 }else if(strcmp($fileType, "mp3") === 0){
				//Do nothing
			 }else if(strcmp($fileType, "webm") === 0){
				//Do nothing
			 }else if(strcmp($fileType, "mpeg") === 0){
				$fileType ="mp3";
			 }else{
				throw new Exception(__('Fichier mp3 uniquement', __FILE__));
			 }
			 $dossier = dirname(__FILE__) . '/../../sound/';
			 //$dossier = '/var/www/uploads/';
			 //reuse tmpnam
			 $fileTmpPath = $_FILES['fdata']['tmp_name'];
			 $fileId= time();//substr($fileTmpPath, strrpos($fileTmpPath, "/") + 1);
			 $fileLabel = $_FILES['fdata']['name'];
			 log::add('gcast', 'debug', 'Transfert vers '.$dossier .  $fileId. '.' .$fileType);
			 if(!is_dir($dossier)) {
				log::add('gcast', 'debug', 'Target dir not found');
			 }else if(!is_writable($dossier)){
				log::add('gcast', 'debug', 'Target dir is not writeable');
			 }
			 $transfertResult = move_uploaded_file($fileTmpPath, $dossier .  $fileId. '.' .$fileType);
			 if($transfertResult) //Si la fonction renvoie TRUE, c'est que ça a fonctionné...
			 {
				//audio/ogg
				if(strcmp($fileType, "ogg") === 0){
					$cmd = '/usr/bin/python ' .dirname(__FILE__) . '/../../resources/action.py oogtomp3 ' . $dossier .  $fileId;
					exec($cmd, $out, $ret);
					log::add('gcast', 'debug', 'Audio ogg to mp3 converted'.$cmd.' '.$ret.'  '.print_r($out,true));
				}else if(strcmp($fileType, "webm") === 0){
					$cmd = '/usr/bin/python ' .dirname(__FILE__) . '/../../resources/action.py webmtomp3 ' . $dossier .  $fileId;
					exec($cmd, $out, $ret);
					log::add('gcast', 'debug', 'Audio webm to mp3 converted'.$cmd.' '.$ret.'  '.print_r($out,true));
				}
				$listValue = getJoueCmdListValue($eqLogic_id);
				if(! empty($listValue)){
					$listValue =  $listValue .';';
				}
				$listValue = $listValue .$fileId.'|'.$fileLabel;
				log::add('gcast', 'debug', 'Upload effectué avec succès !'. $listValue);
				saveJoueCmdListValue($eqLogic_id,$newListValue);
				ajax::success($listValue);
			 }
			 else //Sinon (la fonction renvoie FALSE).
			 {
				throw new Exception(__('Echec du transfert '.$transfertResult, __FILE__));
			 }
		}else{
			throw new Exception(__('Fichier Non trouvé ', __FILE__));
		}
		//$return = utils::o2a($this);
		//$return['mydata'] = 'mywonderfuldata'; 
		//ajax::success($return);
		//ajax::success(jeedom::toHumanReadable(utils::o2a($gcast)));
	}else if (init('action') == 'removeSound') {
		$snd_id = init('snd_id');
		//if (!is_object($gcast)) {
		//	throw new Exception(__('Objet inconnu verifié l\'id : ', __FILE__) . init('id'));
		//}
		$fileToDelete = dirname(__FILE__) . '/../../sound/'.$snd_id. '.mp3';
		$deleted = unlink($fileToDelete);
		log::add('gcast', 'debug', 'File delete path:'.$fileToDelete. '   deleted:'.$deleted);

		//delete in selectable value
		$listValue = getJoueCmdListValue($eqLogic_id);
		$elements = explode(';',$listValue);
		foreach ($elements as $key => $value) {
			$coupleArray = explode('|', $value);
			if(strcmp($coupleArray[0],$snd_id)==0){
				unset($elements[$key]);
			}
		}
		$newListValue = implode(";",$elements);
		saveJoueCmdListValue($eqLogic_id,$newListValue);
		ajax::success($newListValue);
	}
    throw new Exception(__('Aucune méthode correspondante à : ', __FILE__) . init('action'));
    /*     * *********Catch exeption*************** */
} catch (Exception $e) {
    ajax::error(displayExeption($e), $e->getCode());
}

function getJoueCmdListValue($id){
	$eqLogic = gcast::byId($id);
	$cmd =  $eqLogic->getCmd(null, 'joue');
	return $cmd->getConfiguration('listValue');
}
function saveJoueCmdListValue($id,$val){
	$eqLogic = gcast::byId($id);
	$cmd =  $eqLogic->getCmd(null, 'joue');
	$cmd->setConfiguration('listValue',$val);
	//$cmd->save();
	//$cmd->doUpdate();
}

?>
