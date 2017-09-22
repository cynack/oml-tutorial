'use strict';

var VRView = function() {
  this.vrDisplay = null;
  this.skyboxSize = 100;
  this.scene = null;
  this.light = null;
  this.controls = null;
  this.render = null;
  this.camera = null;
  this.cameraCtl = null;
  this.vrButton = null;
  this.loadedCallback = null;
  this.Object3Ds = [];
  this._frameRate = 0;
  this._frameRateChecking = false;
  this._frameRateWarnCount = 0;
  this._frameRateSafeCount = 0;
  this._qualityLevel = 0;
  this.qualityMaxDownLevel = 2;
  this.qualityMaxUpLevel = 1;
  this.onQualityDown = null;
};

window.VRView = VRView;

VRView.prototype.Load = function() {
  var self = this;
  this.renderer = new THREE.WebGLRenderer({antialias: true});
  this.renderer.setPixelRatio(window.devicePixelRatio);
  this.renderer.shadowMap.enabled = true;
  document.body.appendChild(this.renderer.domElement);
  this.scene = new THREE.Scene();
  
  this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  this.controls = new THREE.VRControls(this.camera);
  this.cameraCtl = new THREE.Group();
  this.cameraCtl.quaternion.set(0, 0, 0, 1);
  this.cameraCtl.add(this.camera);
  this.scene.add(this.cameraCtl);
  this.controls.standing = true;
  
  this.light = new THREE.DirectionalLight(0xffffff, 0.7);
  this.light.castShadow = true;
  this.light.shadow.camera.near = 0;
  this.light.shadow.camera.far = 128;
  this.light.shadow.camera.top = 64;
  this.light.shadow.camera.bottom = -64;
  this.light.shadow.camera.right = 64;
  this.light.shadow.camera.left = -64;
  this.light.shadow.mapSize.width = 8192;
  this.light.shadow.mapSize.height = 8192;
  this.scene.add(this.light);
  this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  this.scene.add(this.ambientLight);
  this.setLight([60, 30, 0]);
  //var directionalLightShadowHelper = new THREE.CameraHelper(this.light.shadow.camera);
  //this.scene.add(directionalLightShadowHelper);
  //var directionalLightHelper = new THREE.DirectionalLightHelper(this.light);
  //this.scene.add(directionalLightHelper);
  this.render = new THREE.VREffect(this.renderer);
  this.render.setSize(window.innerWidth, window.innerHeight);
  window.addEventListener('resize', function() {self.onResize.call(self);}, true);
  window.addEventListener('vrdisplaypresentchange', function() {self.onResize.call(self);}, true);
  var cubeLoader = new THREE.CubeTextureLoader();
    cubeLoader.load([
      'img/skybox_east.bmp',
      'img/skybox_west.bmp',
      'img/skybox_up.bmp',
      'img/skybox_down.bmp',
      'img/skybox_north.bmp',
      'img/skybox_south.bmp'
    ], function(cubeTexture) {
      var cubeShader = THREE.ShaderLib[ 'cube' ];
      cubeShader.uniforms[ 'tCube' ].value = cubeTexture;
      cubeShader.uniforms[ 'tFlip' ].value = 1;
      var skyBoxMaterial = new THREE.ShaderMaterial({
          fragmentShader: cubeShader.fragmentShader,
          vertexShader: cubeShader.vertexShader,
          uniforms: cubeShader.uniforms,
          depthWrite: false,
          side: THREE.BackSide
      });
      var  skyMesh = new THREE.Mesh( new THREE.BoxGeometry( self.skyboxSize, self.skyboxSize, self.skyboxSize, 1, 1, 1 ), skyBoxMaterial);
      self.scene.add( skyMesh );
    }
  );
  navigator.getVRDisplays().then(function(displays) {
    if (displays.length > 0) {
      self.vrDisplay = displays[0];
      self.vrDisplay.requestAnimationFrame(function() {
        self.animate();
      });
    }
  });
  this.vrButton = new webvrui.EnterVRButton(this.renderer.domElement, {
    color: 'white',
    background: 'black',
    corners: 'square'
  });
  this.vrButton.on('hide', function() {
    document.getElementById('ui').style.display = 'none';
  });
  this.vrButton.on('show', function() {
    document.getElementById('ui').style.display = 'inherit';
  });
  document.getElementById('vr-button').appendChild(this.vrButton.domElement);
  document.getElementById('magic-window').addEventListener('click', function() {
    self.vrButton.requestEnterFullscreen();
  });
  if(this.loadedCallback)this.loadedCallback();
};

VRView.prototype.setLight = function(params) {
  var lightVector = new THREE.Vector3(0, 0, 1);
  if(params.length == 3) {
    var eu = new THREE.Euler(-Math.PI*params[0]/180, -Math.PI*params[1]/180, Math.PI*params[2]/180, 'XYZ');
    lightVector.applyEuler(eu);
  }
  if(params.length==4) {
    var qt = new THREE.Quaternion(params[0], params[1], -params[2], Math.PI*params[3]/180);
    lightVector.applyQuaternion(qt);
  }
  this.light.position.set(lightVector.x, lightVector.y, lightVector.z);
  this.ambientLight.position.set(lightVector.x, lightVector.y, lightVector.z);
};

VRView.prototype.onResize = function() {
  this.render.setSize(window.innerWidth, window.innerHeight);
  this.camera.aspect = window.innerWidth / window.innerHeight;
  this.camera.updateProjectionMatrix();
};

VRView.prototype.animate = function() {
  if(!this._frameRateChecking) {
    this._frameRateChecking = true;
    self = this;
    setTimeout(function() {
      self._frameRate = 0;
      setTimeout(function() {
        console.info(self._frameRate);
        if(self._frameRate < 40) {
          self._frameRateWarnCount ++;
          if(self._frameRateWarnCount >= 2) {
            self._qualityController(false);
          }
        }else self._frameRateWarnCount = 0;
        if(self._frameRate >= 50) {
          self._frameRateSafeCount ++;
          if(self._frameRateSafeCount >= 10) {
            self._qualityController(true);
          }
        }else self._frameRateSafeCount = 0;
        self._frameRateChecking = false;
      }, 1000);
    }, 1000);
  }
  this._frameRate++;
  this.controls.update();
  this.render.render(this.scene, this.camera);
  var self = this;
  this.vrDisplay.requestAnimationFrame(function() {
    self.animate();
  });
};

VRView.prototype.destroyObject = function(mesh) {
  var geometry = mesh.geometry;
  var material = mesh.material;
  var texture = mesh.texture;
  this.scene.remove(mesh);
  try{geometry.dispose();}catch(e) {}
  try{material.dispose();}catch(e) {}
  try{texture.dispose();}catch(e) {}
};

VRView.prototype.viewObject = function(entity, parentDefine, parent, apropaty, componentPropaty) {
  if(apropaty==null)apropaty = [];
  var defineList = Object.assignDeep(Object.create(null), parentDefine, entity.define);
  if(!parent) {
    parent = this.scene;
    for(var i=0;i < this.Object3Ds.length;i++) {
      this.destroyObject(this.Object3Ds[i]);
    }
    this.Object3Ds = [];
  }
  if(entity.group && entity.component)return;
  if(entity.group) {
    var groupObject = new THREE.Group();
    var propaty = this._propatyComposer([entity], defineList, [], 0);
    if(componentPropaty) {
      groupObject.scale.set(componentPropaty.scale[0], componentPropaty.scale[1], componentPropaty.scale[2]);
      if(componentPropaty.rot[3]) {
        var qt = new THREE.Quaternion();
        qt.setFromAxisAngle(new THREE.Vector3(componentPropaty.rot[0], componentPropaty.rot[1], -componentPropaty.rot[2]), componentPropaty.rot[3]);
        groupObject.rotation.setFromQuaternion(qt);
      }
      else groupObject.rotation.set(-componentPropaty.rot[0], -componentPropaty.rot[1], componentPropaty.rot[2]);
      groupObject.position.set(componentPropaty.pos[0], componentPropaty.pos[1], -componentPropaty.pos[2]);
    }else {
      groupObject.scale.set(propaty.scale[0], propaty.scale[1], propaty.scale[2]);
      if(propaty.rot[3]) {
        var qt = new THREE.Quaternion();
        qt.setFromAxisAngle(new THREE.Vector3(propaty.rot[0], propaty.rot[1], -propaty.rot[2]), propaty.rot[3]);
        groupObject.rotation.setFromQuaternion(qt);
      }
      else groupObject.rotation.set(-propaty.rot[0], -propaty.rot[1], propaty.rot[2]);
      groupObject.position.set(propaty.pos[0], propaty.pos[1], -propaty.pos[2]);
    }
    this.Object3Ds.push(groupObject);
    parent.add(groupObject);
    var self = this;
    entity.group.forEach(function(group) {
      self.viewObject(group, defineList, groupObject, apropaty);
    });
  }
  if(entity.component) {
    this.viewEntity(entity, defineList, parent, apropaty);
  }
};

VRView.prototype._entityParser = function(entity) {
  var entityObject = {
    component: null,
    idclass: null
  };
  var match = /^@(\w+)(((?:\.\w+)|(?:#\w+))*)$/.exec(entity.component);
  if(!match) return false;
  entityObject.component = match[1];
  entityObject.idclass = match[2].match(/((\.|#)\w+)/g);
  return entityObject;
};

VRView.prototype._normalizeSize = function(i, len) {
  var self = this;
  if(len!=null && Array.isArray(i)) {
    if(i.length==len)return i.map(self._normalizeSize, null);
    else{
      var size = [];
      for(i=0;i<len;i++)size.push(1);
      return size;
    }
  }else {
    if(typeof(i) == 'number')return i;
    else if(typeof(i) == 'string') {
      return parseInt(/^([0-9]+)m?$/.exec(i)[1], 10);
    }else return 1;
  }
};
VRView.prototype._normalizePos = function(i) {
  var self = this;
  if(Array.isArray(i)) {
    return i.map(self._normalizePos);
  }else {
    if(typeof(i) == 'number')return i;
    else if(typeof(i) == 'string') {
      return parseInt(/^([0-9]+)m?$/.exec(i)[1], 10);
    }else return 1;
  }
};
VRView.prototype._normalizeColor = function(i) {
  return i;
};
VRView.prototype._normalizeRot = function(i) {
  var self = this;
  if(Array.isArray(i))
    return i.map(self._normalizeRot);
  else {
    if(typeof(i) == 'number')return (i/180*Math.PI);
    else if(typeof(i) == 'string') {
      var _i = parseInt(/^([0-9]+)deg?$/.exec(i)[1], 10);
      return (_i/180*Math.PI);
    }else return 0;
  }
};

VRView.prototype._propatyComposer = function(apropaty, defineList, _idclass, sizeLen) {
  var idclass = _idclass.slice();
  var __firstID = false;
  var cut = [];
  for(var i=0;i<idclass.length;i++) {
    if(__firstID && idclass[i][0]=='#')cut.push(i);
    else if(idclass[i][0]=='#')__firstID=true;
  }
  for(var i=0;i<cut.length;i++) {
    idclass.splice(cut[i]-i, 1);
  }
  idclass.reverse();
  var propaty = Object.create(null);
  propaty.size = [];
  for(var i=0; i<sizeLen; i++)propaty.size[i] = 1;
  propaty.scale = [1, 1, 1];
  propaty.pos = [0, 0, 0];
  propaty.rot = [0, 0, 0];
  propaty.color = '#ffffff';

  var self = this;
  function overwritePropaty(propatyObject) {
    if(propatyObject.size != null && propatyObject.size.length == sizeLen)
      propaty.size = self._normalizeSize(propatyObject.size, sizeLen);
    for(var j=0;j<sizeLen;j++)
      if(propatyObject['size.'+(j+1)] != null)
        propaty.size[j] = self._normalizeSize(propatyObject['size.'+(j+1)], null);

    if(propatyObject.scale != null && propatyObject.scale.length == 3)
      propaty.scale = propatyObject.scale;
    if(propatyObject['scale.x'] != null)
      propaty.scale[0] = propatyObject['scale.x'];
    if(propatyObject['scale.y'] != null)
      propaty.scale[1] = propatyObject['scale.y'];
    if(propatyObject['scale.z'] != null)
      propaty.scale[2] = propatyObject['scale.z'];

    if(propatyObject.pos != null && propatyObject.pos.length == 3)
      propaty.pos = self._normalizePos(propatyObject.pos);
    if(propatyObject['pos.x'] != null)
      propaty.pos[0] = self._normalizePos(propatyObject['pos.x']);
    if(propatyObject['pos.y'] != null)
      propaty.pos[1] = self._normalizePos(propatyObject['pos.y']);
    if(propatyObject['pos.z'] != null)
      propaty.pos[2] = self._normalizePos(propatyObject['pos.z']);

    if(propatyObject.rot != null && propatyObject.rot.length == 3)
      propaty.rot = self._normalizeRot(propatyObject.rot);
    if(propatyObject.rot != null && propatyObject.rot.length == 4) {
      var vec = self._normalizePos([propatyObject.rot[0], propatyObject.rot[1], propatyObject.rot[2]]);
      var rot = self._normalizeRot(propatyObject.rot[3]);
      propaty.rot = [vec[0], vec[1], vec[2], rot];
    }
    if(propatyObject['rot.x'] != null)
      propaty.rot[0] = self._normalizeRot(propatyObject['rot.x']);
    if(propatyObject['rot.y'] != null)
      propaty.rot[1] = self._normalizeRot(propatyObject['rot.y']);
    if(propatyObject['rot.z'] != null)
      propaty.rot[2] = self._normalizeRot(propatyObject['rot.z']);
    if(propatyObject['rot.Θ'] != null)
      propaty.rot[3] = self._normalizeRot(propatyObject['rot.Θ']);

    if(propatyObject.color != null)
      propaty.color = self._normalizeColor(propatyObject.color);
  }

  for(var i=0;i<idclass.length;i++) {
    if(idclass[i][0] == '#')continue;
    overwritePropaty(defineList[idclass[i]]);
  }

  for(var i=0;i<apropaty.length;i++) {
    overwritePropaty(apropaty[i]);
  }
  return propaty;
};

VRView.prototype.viewEntity = function(_entity, defineList, parent, _apropaty) {
  var apropaty=_apropaty.slice();
  apropaty.unshift(_entity);
  var entity = this._entityParser(_entity);
  var idclass = entity.idclass?entity.idclass:[];
  if(Array.isArray(_entity.class))
    for(var i=0;i<_entity.class.length;i++) {
      idclass.unshift('.' + _entity.class[i]);
    }
  else if(_entity.class != null)
    idclass.unshift('.' + _entity.class);
  if(_entity.id != null)
    idclass.unshift('#' + _entity.id);
  switch(entity.component) {
    case 'cube':
      var propaty = this._propatyComposer(apropaty, defineList, idclass, 3);
      var cube = new THREE.Mesh(
        new THREE.CubeGeometry(propaty.size[0], propaty.size[1], propaty.size[2]),
        new THREE.MeshPhongMaterial({color: propaty.color})
      );
      cube.castShadow = true;
      cube.receiveShadow = true;
      cube.scale.set(propaty.scale[0], propaty.scale[1], propaty.scale[2]);
      if(propaty.rot[3]) {
        var qt = new THREE.Quaternion();
        qt.setFromAxisAngle(new THREE.Vector3(propaty.rot[0], propaty.rot[1], -propaty.rot[2]), propaty.rot[3]);
        cube.rotation.setFromQuaternion(qt);
      }
      else cube.rotation.set(-propaty.rot[0], -propaty.rot[1], propaty.rot[2]);
      cube.position.set(propaty.pos[0], propaty.pos[1], -propaty.pos[2]);
      this.Object3Ds.push(cube);
      parent.add(cube);
      break;
    case 'cylinder':
      var propaty = this._propatyComposer(apropaty, defineList, idclass, 2);
      var cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(propaty.size[0]/2, propaty.size[0]/2, propaty.size[1], 50),
        new THREE.MeshPhongMaterial({color: propaty.color})
      );
      cylinder.castShadow = true;
      cylinder.receiveShadow = true;
      cylinder.scale.set(propaty.scale[0], propaty.scale[1], propaty.scale[2]);
      if(propaty.rot[3]) {
        var qt = new THREE.Quaternion();
        qt.setFromAxisAngle(new THREE.Vector3(propaty.rot[0], propaty.rot[1], -propaty.rot[2]), propaty.rot[3]);
        cylinder.rotation.setFromQuaternion(qt);
      }
      else cylinder.rotation.set(-propaty.rot[0], -propaty.rot[1], propaty.rot[2]);
      cylinder.position.set(propaty.pos[0], propaty.pos[1], -propaty.pos[2]);
      this.Object3Ds.push(cylinder);
      parent.add(cylinder);
      break;
    case 'sphere':
      var propaty = this._propatyComposer(apropaty, defineList, idclass, 3);
      var sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshPhongMaterial({color: propaty.color})
      );
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      sphere.scale.set(propaty.size[0]*propaty.scale[0], propaty.size[1]*propaty.scale[1], propaty.size[2]*propaty.scale[2]);
      if(propaty.rot[3]) {
        var qt = new THREE.Quaternion();
        qt.setFromAxisAngle(new THREE.Vector3(propaty.rot[0], propaty.rot[1], -propaty.rot[2]), propaty.rot[3]);
        sphere.rotation.setFromQuaternion(qt);
      }
      else sphere.rotation.set(-propaty.rot[0], -propaty.rot[1], propaty.rot[2]);
      sphere.position.set(propaty.pos[0], propaty.pos[1], -propaty.pos[2]);
      this.Object3Ds.push(sphere);
      parent.add(sphere);
      break;
    case 'plane':
      var propaty = this._propatyComposer(apropaty, defineList, idclass, 2);
      var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(propaty.size[0], propaty.size[1]),
        new THREE.MeshPhongMaterial({color: propaty.color})
      );
      var gplane = new THREE.Group();
      gplane.add(plane);
      plane.castShadow = true;
      plane.receiveShadow = true;
      plane.scale.set(propaty.scale[0], propaty.scale[1], propaty.scale[2]);
      plane.rotation.set(-Math.PI/2, 0, 0);
      if(propaty.rot[3]) {
        var qt = new THREE.Quaternion();
        qt.setFromAxisAngle(new THREE.Vector3(propaty.rot[0], propaty.rot[1], -propaty.rot[2]), propaty.rot[3]);
        gplane.rotation.setFromQuaternion(qt);
      }
      else gplane.rotation.set(-propaty.rot[0], -propaty.rot[1], propaty.rot[2]);
      gplane.position.set(propaty.pos[0], propaty.pos[1], -propaty.pos[2]);
      this.Object3Ds.push(plane);
      parent.add(gplane);
      break;
    default:
      if(defineList['@'+entity.component]!=null) {
        var propaty = this._propatyComposer(apropaty, defineList, idclass, 0);
        this.viewObject(defineList['@'+entity.component], defineList, parent, _apropaty, propaty);
      }
      break;
  }
};

VRView.prototype._qualityController = function(up) {
  if(up) {
    if(this._qualityLevel < this.qualityMaxUpLevel) {
      console.warn('quality up');
      if(this._qualityLevel == -this.qualityMaxDownLevel) {
        console.warn('shadow on');
        this.renderer.shadowMap.enabled = true;
        this.light.castShadow = true;
      }
      this.light.shadow.mapSize.width *= 2;
      this.light.shadow.mapSize.height *=2;
      this._qualityLevel ++;
    }
  }else{
    if(this._qualityLevel > -this.qualityMaxDownLevel) {
      console.warn('quality down');
      this.light.shadow.mapSize.width /= 2;
      this.light.shadow.mapSize.height /=2;
      this._qualityLevel --;
      if(this._qualityLevel == -this.qualityMaxDownLevel) {
        console.warn('shadow off');
        this.renderer.shadowMap.enabled = false;
        this.light.castShadow = false;
      }
    }
  }
  if(this.onQualityDown!=null)this.onQualityDown();
};

Object.assignDeep = function (target) {
  'use strict';
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }
  var to = Object(target);
  for (var index = 1; index < arguments.length; index++) {
    var nextSource = arguments[index];
    if (nextSource != null) {
      for (var nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          if (typeof to[nextKey] === 'object' 
            && to[nextKey] 
            && typeof nextSource[nextKey] === 'object' 
            && nextSource[nextKey]) {
            Object.assignDeep(to[nextKey], nextSource[nextKey]);
          } else {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
  }
  return to;
};