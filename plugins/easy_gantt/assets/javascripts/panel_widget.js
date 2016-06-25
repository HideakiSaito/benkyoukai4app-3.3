/**
 * Created by Ringael on 24. 8. 2015.
 */
window.ysy = window.ysy || {};
ysy.view = ysy.view || {};

ysy.view.Toolbars = function () {
  ysy.view.Widget.call(this);
};
ysy.view.extender(ysy.view.Widget, ysy.view.Toolbars, {
  name: "ToolbarsWidget",
  template: "",
  childTargets: {
    "SuperPanelWidget": "#supertop_panel",
    "BottomPanelWidget": "#gantt_footer_buttons",
    "BaselinePanelWidget": "#baseline_panel",
    "CriticalPanelWidget": "#critical_panel",
    "AddTaskPanelWidget": "#add_task_panel",
    "LegendWidget": "#easy_gantt_footer_legend",
    "AffixWidget": "#easy_gantt_menu"
  },
  _updateChildren: function () {
    if (this.children.length > 0) {
      return;
    }
    var superpanel = new ysy.view.SuperPanel();
    superpanel.init(ysy.settings.sample);
    this.children.push(superpanel);

    var toppanel = new ysy.view.AllButtons();
    toppanel.init();
    this.children.push(toppanel);

    ysy.proManager.initProToolbars(this);

    var legend = new ysy.view.Legend();
    legend.init(null);
    this.children.push(legend);

    if (window.affix || !ysy.settings.easyRedmine) {
      var affix = new ysy.view.Affix();
      ysy.view.affix = affix;
      affix.init();
      this.children.push(affix);
    } else {
      ysy.view.affix = {
        requestRepaint: function () {
        }
      };
    }

  },
  _repaintCore: function () {
    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      this.setChildTarget(child, i);
      child.repaint(true);
    }
  },
  setChildTarget: function (child/*, i*/) {
    if (this.childTargets[child.name]) {
      child.$target = this.$target.find(this.childTargets[child.name]);
    }
  }
});
//#############################################################################################
ysy.view.AllButtons = function () {
  ysy.view.Widget.call(this);
};
ysy.view.extender(ysy.view.Widget, ysy.view.AllButtons, {
  name: "AllButtonsWidget",
  templateName: "AllButtons",
  extendees: {
    test: {
      func: function () {
        ysy.test.run();
      }, on: true,
      hid: true
    },
    back: {
      bind: function () {
        this.model = ysy.history;
      },
      func: function () {
        ysy.history.revert();
      },
      isDisabled: function () {
        return ysy.history.isEmpty();
      }

    },
    save: {
      bind: function () {
        this.model = ysy.history;
        this.sample = ysy.settings.sample;
        this._register(this.sample);
      },
      func: function () {
        if (ysy.settings.sample.active) {
          ysy.data.loader.load();
          return;
        }
        ysy.data.save();
      },
      specialRepaint: function () {
        var button_labels = ysy.view.getLabel("buttons");
        if (ysy.settings.sample.active) {
          var label = button_labels.button_reload;
        } else {
          label = button_labels.button_save;
        }
        this.$target.children().html(label);
      },
      //isHidden:function(){return ysy.settings.sample.active;},
      isDisabled: function () {
        return this.model.isEmpty()
      }
    },
    day_zoom: {
      value: "day",
      bind: function () {
        this.model = ysy.settings.zoom;
      },
      func: function () {
        if (ysy.settings.zoom.setSilent("zoom", this.value)) ysy.settings.zoom._fireChanges(this, this.value);
      },
      isOn: function () {
        return ysy.settings.zoom.zoom === this.value;
      }
    },
    week_zoom: {
      value: "week",
      bind: function () {
        this.model = ysy.settings.zoom;
      },
      func: function () {
        if (ysy.settings.zoom.setSilent("zoom", this.value)) ysy.settings.zoom._fireChanges(this, this.value);
      },
      isOn: function () {
        return ysy.settings.zoom.zoom === this.value;
      }
    },
    month_zoom: {
      value: "month",
      bind: function () {
        this.model = ysy.settings.zoom;
      },
      func: function () {
        if (ysy.settings.zoom.setSilent("zoom", this.value)) ysy.settings.zoom._fireChanges(this, this.value);
      },
      isOn: function () {
        return ysy.settings.zoom.zoom === this.value;
      }
    },
    task_control: {
      bind: function () {
        this.model = ysy.settings.controls;
      },
      func: function () {
        ysy.settings.controls.setSilent("controls", !this.isOn());
        ysy.settings.controls._fireChanges(this, !this.isOn());
        //this.on=!$(".gantt_bars_area").toggleClass("no_task_controls").hasClass("no_task_controls");
        $(".gantt_bars_area").toggleClass("no_task_controls");
        this.requestRepaint();
      },
      isOn: function () {
        return ysy.settings.controls.controls;
      },
      isHidden: function () {
        // return !ysy.settings.permissions.allowed("edit_easy_gantt", "edit_issues");
        return false;
      }
    },
    resource_help: {},
    add_task_help: {},
    baseline_help: {},
    critical_help: {},
    print: {
      func: function () {
        return ysy.view.print.print();
      }
    },
    sample: {
      bind: function () {
        this.model = ysy.settings.sample;
      },
      func: function () {
        if (ysy.data.loader.loaded) {
          this.model.toggle();
          ysy.data.loader.load();
        }
      },
      isOn: function () {
        return this.model.active;
      }
      //icon:"zoom-in icon-day"
    },
    close_all_parents: {
      bind: function () {
        this.model = ysy.data.limits;
      },
      func: function () {
        var openings = this.model.openings;
        var issues = ysy.data.issues.getArray();
        this.model.parentsIssuesClosed = !this.model.parentsIssuesClosed;
        if (this.model.parentsIssuesClosed) {
          for (var i = 0; i < issues.length; i++) {
            openings[issues[i].getID()] = false;
          }
        } else {
          for (i = 0; i < issues.length; i++) {
            delete openings[issues[i].getID()];
          }
        }
        this.model._fireChanges(this, "close_all_parent_issues");
      },
      isOn: function () {
        return this.model.parentsIssuesClosed;
      },
      isHidden: function () {
        return ysy.settings.global;
      }
    },
    jump_today: {
      func: function () {
        gantt.showDate(moment());
      }
    },
    delayed_project_filter: {
      bind: function () {
        this.model = ysy.data.limits;
      },
      func: function () {
        this.model.filter_delayed_projects = !this.model.filter_delayed_projects;
        this.model._fireChanges(this, "click");
      },
      isOn: function () {
        return this.model.filter_delayed_projects;
      },
      isHidden: function () {
        return !ysy.settings.global;
      }
    }
  },
  _updateChildren: function () {
    var children = [];
    this.$target = $("#content");
    //var spans=this.$target.children("span");
    for (var elid in this.extendees) {
      if (!this.extendees.hasOwnProperty(elid)) continue;
      var extendee = this.extendees[elid];
      if (!this.getChildTarget(extendee, elid).length) continue;
      var button;
      if (extendee.isSelect) {
        button = new ysy.view.Select();
      } else {
        button = new ysy.view.Button();
      }
      $.extend(button, extendee, {elid: elid});
      button.init();
      children.push(button);
    }
    this.children = children;
  },
  out: function () {
    //return {buttons:this.child_array};
  },
  _repaintCore: function () {
    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      this.setChildTarget(child, i);
      child.repaint(true);
    }
  },
  setChildTarget: function (child /*,i*/) {
    child.$target = this.getChildTarget(child);
  },
  getChildTarget: function (child, elid) {
    if (!elid) elid = child.elid;
    if (child.isSelect) return this.$target.find("#select_" + elid);
    return this.$target.find("#button_" + elid);
  }
});
//##############################################################################
ysy.view.SuperPanel = function () {
  ysy.view.Widget.call(this);
};
ysy.view.extender(ysy.view.Widget, ysy.view.SuperPanel, {
  name: "SuperPanelWidget",
  templateName: "SuperPanel",
  _repaintCore: function () {
    if (!this.template) {
      var templ = ysy.view.getTemplate(this.templateName);
      if (templ) {
        this.template = templ;
      } else {
        return true;
      }
    }
    var rendered = Mustache.render(this.template, this.out()); // REPAINT
    var $easygantt = $("#easy_gantt");
    $easygantt.find(".flash").remove();
    this.$target = $(rendered);
    $easygantt.prepend(this.$target);
    //window.showFlashMessage("notice",rendered);
    this.tideFunctionality();
  },
  out: function () {
    var obj, label;
    var free = !!ysy.settings.sample.getSampleVersion(false);
    if (free) {
      label = ysy.view.getLabel("sample_global_free_text");
      obj = {global_free: true};
    } else {
      label = ysy.view.getLabel("sample_text");
      obj = {};
    }
    return $.extend({}, {text: label}, {sample: this.model.active}, obj);
  },
  tideFunctionality: function () {
    this.$target.find("#sample_close_button").click($.proxy(function () {
      if (ysy.data.loader.loaded) {
        this.model.setViewed();
        this.model.setSilent("active", false);
        this.model._fireChanges(this, "toggle");
        ysy.data.loader.load();
      }
    }, this));
    this.$target.find("#sample_video_button").click($.proxy(function () {
      if (ysy.settings.global) {
        var template = ysy.view.getTemplate("video_modal_global");
      } else {
        template = ysy.view.getTemplate("video_modal");
      }
      var $modal = ysy.main.getModal("video-modal", "850px");
      $modal.html(template); // REPAINT
      $modal.off("dialogclose");
      window.showModal("video-modal", 850);
      $modal.on("dialogclose", function () {
        $modal.empty();
      });
    }));
  }
});
//##############################################################################
ysy.view.Button = function () {
  ysy.view.Widget.call(this);
  this.on = false;
  this.disabled = false;
  this.func = function () {
    var div = $(this.$target).next('div');
    var x = div.clone().attr({"id": div[0].id + "_popup"}).appendTo($("body"));
    showModal(x[0].id);
    //var template=ysy.view.getTemplate("easy_unimplemented");
    //var rendered=Mustache.render(template, {modal: ysy.view.getLabel("soon_"+this.elid)});
    //$("#ajax-modal").html(rendered); // REPAINT
    //window.showModal("ajax-modal");
  }
};
ysy.view.extender(ysy.view.Widget, ysy.view.Button, {
  name: "ButtonWidget",
  templateName: "Button",
  _replace: true,
  init: function () {
    if (this.bind) {
      this.bind();
    }
    if (this.model) {
      this._register(this.model);
    }
    //this.tideFunctionality();
    return this;
  },
  tideFunctionality: function () {
    if (this.func && !this.isDisabled() && this.$target.attr("href") === "javascript:void(0)") {
      this.$target.off("click").on("click", $.proxy(this.func, this));
    }
  },
  isHidden: function () {
    return this.hid;
  },
  _repaintCore: function () {
    var target = this.$target;
    //var link = target.children();
    if (this.isHidden()) {
      target.hide();
    } else {
      target.show();
    }
    if (this.isDisabled()) {
      target.addClass("disabled");
      //link.addClass("disabled");
      target.removeClass("active");
      //link.removeClass("active");
    } else {
      target.removeClass("disabled");
      //link.removeClass("disabled");
      if (this.isOn()) {
        target.addClass("active");
        //link.addClass("active");
      } else {
        target.removeClass("active");
        //link.removeClass("active");
      }
    }
    if (this.specialRepaint) {
      this.specialRepaint();
    }
    this.tideFunctionality();
  },
  isOn: function () {
    return this.on;
  },
  isDisabled: function () {
    return this.disabled;
  }
});
//##############################################################################
ysy.view.Select = function () {
  ysy.view.Button.call(this);
  this.func = function () {
  }
};
ysy.view.extender(ysy.view.Button, ysy.view.Select, {
  name: "SelectWidget",
  templateName: "Select",
  tideFunctionality: function () {
    if (this.func && !this.isDisabled()) {
      this.$target.off("change").on("change", $.proxy(this.func, this));
    }
  },
  specialRepaint: function () {
    this.$target.val(this.modelValue());
  },
  modelValue: function () {
    return "";
  }
});
//####################################################
ysy.view.Legend = function () {
  ysy.view.Widget.call(this);
};
ysy.view.extender(ysy.view.Widget, ysy.view.Legend, {
  name: "LegendWidget",
  templateName: "legend",
  _postInit: function () {
  },
  out: function () {
    return null;
    //return {text: "Legend for EasyGantt"};
  }
});
//###################################################
ysy.view.Affix = function () {
  ysy.view.Widget.call(this);
  this.offset = 0;
};
ysy.view.extender(ysy.view.Widget, ysy.view.Affix, {
  name: "AffixWidget",
  init: function () {
    this.$document = $(document);
    this.$superPanel = $("#supertop_panel");
    this.$cont = $("#gantt_cont");
    this.$document.on("scroll", $.proxy(this.requestRepaint, this));
    if (ysy.settings.easyRedmine) {
      this.offset += $("#top-menu").outerHeight();
    }
    //this._updateChildren();
  },
  _repaintCore: function () {
    var top = this.$document.scrollTop() + this.offset - this.$superPanel.offset().top - this.$superPanel.outerHeight();
    top = Math.max(Math.floor(top), 0);
    this.setPosition(top);
  },
  setPosition: function (top) {
    this.$target.css({transform: "translate(0, " + top + "px)"});
    this.$cont.find(".gantt_grid_scale, .gantt_task_scale").css({transform: "translate(0, " + (top - 1) + "px)"});
  }
});
