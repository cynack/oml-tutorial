import React from 'react';
import { render } from 'react-dom';
import AceEditor from 'react-ace';
import 'brace/mode/json';
import 'brace/theme/github';
import io from 'socket.io-client';
import QRCode from "qrcode.react";
import { CSSTransitionGroup } from 'react-transition-group';
import style from './index.css';

let socket;
let vrview;
const defaultData = `
{
	"version": "^0.0.2",
	"group": [{
		"group": [{
			"component": "@cube",
			"size": [0.5,2,0.5],
			"pos": [-1,1,0],
			"color":"#ff0000"
		},{
			"component": "@cube",
			"size": [0.5,2,0.5],
			"pos": [-0.25,0.25,0],
			"color":"#ff0000",
			"rot": [0,0,90]
		},{
			"component": "@cube",
			"size": [0.5,2,0.5],
			"pos": [1.5,2,0],
			"color":"#ff0000"
		},{
			"component": "@cube",
			"size": [0.5,2,0.5],
			"pos": [0.75,2.75,0],
			"color":"#ff0000",
			"rot": [0,0,90]
		},{
			"component": "@cube",
			"size": [0.5,1.45,0.5],
			"pos": [-0.6,2.3,0],
			"color":"#ff0000",
			"rot": [0,0,-45]
		},{
			"component": "@cube",
			"size": [0.5,1.45,0.5],
			"pos": [1.1,0.7,0],
			"color":"#ff0000",
			"rot": [0,0,-45]
		}],
		"pos": [0,0,0]
	},{
		"component": "@plane",
		"size": [50,50]
	}],
	"pos": [0,0,6]
}`;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      last_input: '',
      rawdata: defaultData,
      data: Object.create(null),
      showingQR: false,
      id: '',
      alert: true
    };
    this.onChange = this.onChange.bind(this);
  }
  componentDidMount() {
  }
  render() {
    return(
      <div className={style.root}>
        <CSSTransitionGroup transitionName="QR" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
        {(()=>{
          if(this.state.showingQR)
            return(
            <div className={style.qrwrap}> 
            <div className={style.qrback}>
              <div className={style.qrcard}>
                <div className={style.qrcode}>
                  <QRCode
                    value = {`${location.origin}${location.pathname}view-only#${this.state.id}`}
                  />
                </div>
                <p>or</p>
                <p>Access to <a href={`${location.origin}${location.pathname}view-only#${this.state.id}`}>
                  {`${location.origin}${location.pathname}view-only#${this.state.id}`}
                </a></p>
                <div className={style.qrclose} ><button onClick={()=>{this.setState({showingQR:false})}} >CLOSE</button></div>
              </div>
            </div>
            </div>);
        })()}
        </CSSTransitionGroup>
        <CSSTransitionGroup transitionName="QR" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
        {(()=>{
          if(this.state.alert)
            return(
            <div className={style.alertwrap}>
            <div className={style.alertback}>
              <div className={style.alertcard}>
                <p>This is quick tutorial is for the Object Markup Language.</p>
                <p>Some components cannot be used even though they are defined in the document.</p>
                <p>The recommended browser is Google Chrome.</p>
                <div className={style.alertclose} ><button onClick={()=>{this.setState({alert:false})}} >CLOSE</button></div>
              </div>
            </div>
            </div>);
        })()}
        </CSSTransitionGroup>
        <div className={style.nav}>
          <img src='../img/oml.png' className={style.logo} />
          <a href="javascript:void(0)" className={style.otherDevice} onClick={()=>{
            this.getID((id)=>{
              this.setState({id: id, showingQR: true});
            });
          }}><img src="../img/other_device.png" /></a>
        </div>
        <div className={style.content}>
          <AceEditor
          className = {style.AceEditor}
            mode = "json"
            theme = "github"
            onChange = {(text)=>{this.onChange(text)}}
            value = {this.state.rawdata}
            //AceEditor Bug: https://github.com/securingsincity/react-ace/issues/181
          />
          <iframe
            id="vrview"
            className = {style.Iframe}
            src = "view"
            display= "initial"
            width= "50%"
            height= "100%"
            scrolling="no"
            allowFullScreen
            onLoad={()=>{
              const VRView = document.getElementById('vrview').contentWindow.VRView;
              vrview = new VRView();
              vrview.Load();
              let data = JSON.parse(this.state.rawdata)
              this.setState({data: data});
              vrview.viewObject(data);
            }}
          />
          <a href="http://cynack.com"><img src='../img/powered_by.png' className={style.powered_by} /></a>
        </div>
      </div>
    )
  }
  onChange(text) {
    this.setState({rawdata: text, last_input: text})
    setTimeout(()=>{
      if(this.state.last_input==text){
        let _data = JSON.parse(text);
        this.setState({data:_data});
        vrview.viewObject(_data);
        if(socket && socket.connected)socket.emit('send_data', _data);
      }
    },500)
  }
  getID(callback) {
    if(!socket || !socket.connected){
      socket = io.connect()
      socket.on('connect', ()=>{
        callback(socket.id);
      });
      socket.on('disconnect', ()=>{
        alert('disconnected.');
      });
      socket.on('request_data', ()=>{
        socket.emit('send_data', this.state.data);
      })
      socket.emit('create_view','');
    }else{
      callback(socket.id);
    }
  }
}

render(<App/>, document.getElementById('root'));