import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'scooter-dash';

  public configs: any[] = [];
  public configMap = {};

  public settings: any[] = [];
  public delConfirmation = false;

  public settingsInEditMode = null;
  @ViewChild("name") nameField: ElementRef;

  constructor(private httpClient: HttpClient) {

  }

  ngOnInit(): void {
    this.httpClient.get<any[]>("/api/config").subscribe(result => {
      this.configs = result;
      result.forEach(config => {
        this.configMap[config.id] = config;
      });
    });

    this.httpClient.get<any[]>("/api/settings").subscribe(result => {
      this.settings = result;
    });
  }

  
  configParam(type, paramName) {
    let foundParamFromConfig = null;
    let configForType = this.configMap[type];
    if (!configForType) {
      //console.log("cannot find config for type " + type)
      return {};
    } else {
      configForType.params.forEach(param => {
        if (param.name == paramName) {
          foundParamFromConfig = param;
          return;
        }
      });
    }
    return foundParamFromConfig;
  }

  cloneSetting(setting) : void {
    var newSetting = JSON.parse(JSON.stringify(setting));
    newSetting.id = this.guid();
    newSetting.name = setting.name + "*";
    this.settings.push(newSetting);
  }
  
  createSettingFromConfig(config) {
    let setting = { id: this.guid(), name: config.name + "*", type: config.id, params: [] };
    config.params.forEach(param => {
      setting.params.push({ name: param.name, value: param.defaultValue });
    });
    return setting;
  }

  cloneConfig(config): void {
    this.settings.push(this.createSettingFromConfig(config));
  }

  edit(setting) {
    this.settingsInEditMode = setting;
    setTimeout(() => {
      this.nameField.nativeElement.focus();
      this.nameField.nativeElement.select();
    }, 10)
  }
  
  saveSetting(setting): void {
    this.httpClient.put<boolean>("/api/settings/" + setting.id, setting).subscribe(result => {
      console.log("setting saved");
    });
  }

  deleteSetting(setting) {
    if (!this.delConfirmation) {
      this.delConfirmation = true;
      setTimeout(() => { this.delConfirmation = false }, 2000);
    } else {
      this.httpClient.delete<boolean>("/api/settings/" + setting.id).subscribe(result => {
        console.log("setting deleted");
        var index = this.settings.indexOf(setting);
        if (index > -1) {
          this.settings.splice(index, 1);
        }
      });
    }
  }

  isHueParam(paramName) : boolean {
    return paramName && paramName.indexOf("hue") >= 0;
  }

  testConfig(config) : void {
    let setting = this.createSettingFromConfig(config);
    this.activateSetting(setting);
  }

  activateSetting(setting): void {
    let url = "/api/?type=" + setting.type;
    setting.params.forEach(p => {
      url += "&" + p.name + "=" + p.value;
    });
    console.log("here we send to request to " + url);
    this.httpClient.get<string>(url).subscribe(result => {
      console.log("settings activated´");
    });
  }

  changeValue(param, value) {
    param.value = value;
  }

  private guid(): string {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }
}
