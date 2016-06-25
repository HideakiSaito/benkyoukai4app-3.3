window.ysy = window.ysy || {};
ysy.view = ysy.view || {};
ysy.view.initGantt = function () {
  // WORKTIME settings
  // standart non-working days in dhtmlx gantt is Saturday and Sunday.
  // So at first we make all days non-working.
  var work_helper = gantt._working_time_helper;
  work_helper.defHours = ysy.settings.hoursPerDay;
  var i;
  // Now we specify working days
  var nonWorking = ysy.settings.nonWorkingWeekDays;
  for (i = 0; i < nonWorking.length; i++) {
    work_helper.set_time({day: nonWorking[i] % 7, hours: false});
  }
  // Now we specify holidays
  var holidays = ysy.data.limits.holidays;
  if (holidays) {
    for (i = 0; i < holidays.length; i++) {
      work_helper.set_time({date: moment(holidays[i]), hours: false});
    }
  }
  gantt.constructColumns = function (columns) {
    var dcolumns = [];
    //var columns=ysy.data.columns;
    var columnBuilders = {
      id: function (obj) {
        if (obj.id > 1000000000000) return '';
        var path = ysy.settings.paths.rootPath + "issues/";
        return "<a href='" + path + obj.id + "' title='" + obj.text + "' target='_blank'>#" + obj.id + "</a>";
      },
      updated_on: function (obj) {
        if (!obj.columns)return "";
        var value = obj.columns.updated_on;
        if (value) {
          return moment.utc(value, 'YYYY-MM-DD HH:mm:ss ZZ').fromNow();
        } else {
          return "";
        }
      },
      done_ratio: function (obj) {
        if (!obj.columns)return "";
        //return '<span class="multieditable">'+Math.round(obj.progress*10)*10+'</span>';
        return '<span >' + Math.round(obj.progress * 10) * 10 + '</span>';
      },
      estimated_hours: function (obj) {
        if (!obj.columns)return "";
        return '<span >' + obj.estimated + '</span>';
      },
      subject: function (obj) {
        var id = parseInt(obj.real_id);
        if (isNaN(id) || id > 1000000000000) return obj.text;
        var path = ysy.settings.paths.rootPath + "issues/";
        if (obj.type === "milestone") {
          path = ysy.settings.paths.rootPath + "versions/"
        } else if (obj.type === "project") {
          path = ysy.settings.paths.rootPath + "projects/"
        } else if (obj.type === "assignee") {
          path = ysy.settings.paths.rootPath + "users/"
        }
        return "<a href='" + path + id + "' title='" + obj.text + "' target='_blank'>" + obj.text + "</a>";
      },
      _default: function (col) {
        var template = '<div class="' + (col.target ? 'multieditable' : '') + '"' + (col.target ? ' data-name="' + col.target + '"' : '') + (col.type ? ' data-type="' + col.type + '"' : '') + (col.source ? ' data-source="' + col.source + '"' : '') + ' {{#value_id}}data-value="{{value_id}}"{{/value_id}} title="{{value}}">{{value}}</div>';
        return function (obj) {
          if (!obj.columns)return "";
          var value = obj.columns[col.name];
          return Mustache.render(template, {
            issue_id: obj.real_id,
            value: value,
            value_id: obj.columns[col.name + "_id"]
          });
        }
      }
    };
    ysy.view.columnBuilders = columnBuilders;
    var getBuilder = function (col) {
      if (columnBuilders[col.name]) {
        if (col.name === "assigned_to") {
          return columnBuilders.assigned_to(col);
        }
        return columnBuilders[col.name];
      }
      else return columnBuilders._default(col);
    };
    for (var i = 0; i < columns.length; i++) {
      var col = columns[i];
      if (col.name === "id" && !ysy.settings.easyRedmine) continue;
      var css = "gantt_grid_body_" + col.name;
      if (col.name !== "") {
        var width = gantt.config.columnsWidth[col.name] || gantt.config.columnsWidth["other"];
        var dcolumn = {
          name: col.name,
          label: col.title,
          min_width: width,
          width: width,
          tree: col.name === "subject",
          align: col.name === "subject" ? "left" : "center",
          template: getBuilder(col),
          css: css
        };
        if (col.name === "subject") {
          dcolumns.unshift(dcolumn);
        } else {
          dcolumns.push(dcolumn);
        }
      }
    }
    return dcolumns;
  };
  var toMomentFormat = function (rubyFormat) {
    switch (rubyFormat) {
      case '%Y-%m-%d':
        return 'YYYY-MM-DD';
      case '%d/%m/%Y':
        return 'DD/MM/YYYY';
      case '%d.%m.%Y':
        return 'DD.MM.YYYY';
      case '%d-%m-%Y':
        return 'DD-MM-YYYY';
      case '%m/%d/%Y':
        return 'MM/DD/YYYY';
      case '%d %b %Y':
        return 'DD MMM YYYY';
      case '%d %B %Y':
        return 'DD MMMM YYYY';
      case '%b %d, %Y':
        return 'MMM DD, YYYY';
      case '%B %d, %Y':
        return 'MMMM DD, YYYY';
      default:
        return 'D. M. YYYY';
    }
  };
  $.extend(gantt.config, {
    //xml_date: "%Y-%m-%d",
    //scale_unit: "week",
    //date_scale: "Week #%W",
    //autosize:"y",
    details_on_dblclick: false,
    readonly_project: true,
    //autofit:true,
    drag_empty: true,
    work_time: true,
    //min_duration:24*60*60*1000, // 1*24*60*60*1000s = 1 day
    correct_work_time: true,
    //date_grid: "%j %M %Y",
    date_format: toMomentFormat(ysy.settings.dateFormat),
    date_grid: "%j.%n.%Y",
    links: {
      finish_to_start: "precedes",
      start_to_start: "start_to_start",
      start_to_finish: "start_to_finish",
      finish_to_finish: "finish_to_finish"
    },
    step: 1,
    duration_unit: "day",
    fit_tasks: true,
    task_height: 20,
    min_column_width: 30,
    row_height: 25,
    autosize: "y",
    link_line_width: 0,
    scale_height: 60,
    start_on_monday: true,
    order_branch: true,
    rearrange_branch: true,
    grid_resize: true,
    grid_width: ysy.data.limits.columnsWidth.grid_width,
    task_scroll_offset: 250,
    controls_task: {progress: true, resize: true, links: true},
    controls_milestone: {},
    start_date: ysy.data.limits.start_date,
    end_date: ysy.data.limits.end_date,
    controls_project: {show_progress: true, resize: false},
    allowedParent_task: ["project", "milestone", "empty"],
    allowedParent_task_global: ["project", "milestone"],
    allowedParent_milestone: ["project"],
    allowedParent_project: ["empty"],
    columnsWidth: ysy.data.limits.columnsWidth
  });
  gantt.config.columns = gantt.constructColumns(ysy.data.columns);
  $.extend(gantt.config, ysy.proManager.getConfig());
  gantt._pull["empty"] = {
    type: "empty",
    id: "empty",
    $target: [],
    $source: [],
    columns: {},
    text: "",
    start_date: moment()
  };
};
/*ysy.view.applyEasyPatch=function(){
 $.extend(true,$.fn.editable.defaults, {
 ajaxOptions: {
 complete: function(jqXHR) {
 window.easy_lock_verrsion = jqXHR.getResponseHeader('X-Easy-Lock-Version');
 window.easy_last_journal_id = jqXHR.getResponseHeader('X-Easy-Last-Journal-Id');
 ysy.log.debug("after inline editation","inline");
 //ysy.data.loader.loadOne(this.url);
 ysy.data.loader.load();
 }}});
 };*/
ysy.view.applyGanttPatch = function () {
  ysy.data.limits.columnsWidth = {
    id: 60,
    subject: 200,
    project: 140,
    other: 70,
    updated_on: 85,
    assigned_to: 100,
    grid_width: 400
  };
  gantt.locale.date = ysy.settings.labels.date;
  $.extend(gantt.templates, {
    task_cell_class: function (item, date) {
      if (gantt.config.scale_unit === "day") {
        //var css="";
        if (moment(date).date() === 1) {
          return true;
          //  css+=" first-date";
        }
        //return css;
      }
      return false;
    },
    scale_cell_class: function (date) {
      if (gantt.config.scale_unit === "day") {
        var css = "";
        if (!gantt._working_time_helper.is_working_day(date)) {
          css += " weekend";
        }
        //if(date.getDate()===1){
        if (moment(date).date() === 1) {
          css += " first-date";
        }
        return css;
      }
    },
    rightside_text: function (start, end, task) {
      return task.text;
    },
    task_text: function (start, end, task) {
      return "";
    },
    task_class: function (start, end, task) {
      var css = "";
      if (task.css) {
        css = task.css;
      }
      css += " " + (task.type || "task") + "-type";
      if (task.widget && task.widget.model) {
        var problems = task.widget.model.getProblems();
        if (problems) {
          css += " wrong " + problems.join(" ");
        }
      }
      if (gantt._get_safe_type(task.type) === "task"
          && css.indexOf("closed") < 0
          && end
          && end.isBefore(moment().subtract(1, "day"))) {
        css += " overdue";
      }
      css += ysy.proManager.getTaskClass(task);
      return css;
    },
    grid_row_class: function (start, end, task) {
      var ret = "";
      if (task.css) {
        ret = task.css;
      }
      if (gantt._get_safe_type(task.type) === "task"
          && ret.indexOf("closed") < 0
          && end
          && end.isBefore(moment().subtract(1, "day"))) {
        ret += " overdue";
      }
      ret += " " + (task.type || "task") + "-type";
      return ret;//+'" data-url="/issues/'+task.id+' data-none="';
      //return task.css+" "+task.type+"-type";
    },
    /*grid_file: function (item) {
     return "";
     //return "<div class='gantt_tree_icon gantt_file'></div>";
     },*/
    link_class: function (link) {
      var css = "type-" + link.type;
      if (link.widget) {
        if (link.widget.model) {
          if (!link.widget.model.checkDelay()) {
            css += " wrong";
          }
        }
      }
      return css;
    },
    drag_link: function (from, from_start, to, to_start) {
      var labels = ysy.view.getLabel("links");
      if (!gantt._get_link_type(from_start, to_start)) {
        var reason = "unsupported_link_type";
      } else if (from === to) {
        reason = "loop_link";
      } else if (to && to.length > 12) {
        reason = "link_target_new";
      } else if (to && gantt.getTask(to).readonly) {
        reason = "link_target_readonly";
      } else {
        reason = "other";
      }
      var obj = {
        errorReason: ysy.view.getLabel("errors2")[reason],
        from: gantt.getTask(from).text
      };
      if (to) {
        obj.to = gantt.getTask(to).text;
        var ganttLinkType = (from_start ? "start" : "finish") + "_to_" + (to_start ? "start" : "finish");
        obj.type = labels[gantt.config.links[ganttLinkType]];
      }
      return Mustache.render(ysy.view.templates.linkDragModal, obj);
    }
  });

  gantt.attachEvent("onRowDragStart", function (id, elem) {
    //$(".gantt_grid_data").addClass("dragging");
    var task = gantt.getTask(id);
    var allowed = gantt.allowedParent(task);
    if (!allowed) return true;
    allowed = $.map(allowed, function (el) {
      return "." + el + "-type";
    });
    $(allowed.join(", ")).not(".gantt-fresh").addClass("gantt_drag_to_allowed");
    return true;
  });
  gantt.attachEvent("onRowDragEnd", function (id, elem) {
    //$(".gantt_grid_data").removeClass("dragging");
    $(".gantt_drag_to_allowed").removeClass("gantt_drag_to_allowed");
  });

  // Funkce pro vytvoření a posunování Today markeru
  function initTodayMarker() {
    var date_to_str = gantt.date.date_to_str(gantt.config.task_date);
    var id = gantt.addMarker({start_date: new Date(), css: "today", title: date_to_str(new Date())});
    setInterval(function () {
      var today = gantt.getMarker(id);
      today.start_date = new Date();
      today.title = date_to_str(today.start_date);
      gantt.updateMarker(id);
    }, 1000 * 60 * 60);
  }

  initTodayMarker();

  //gantt.initProjectMarker=function initProjectMarker(start,end) {
  //    if(start&&start.isValid()){
  //        var startMarker = gantt.addMarker({start_date: start.toDate(), css: "start", title: "Project start"});
  //    }
  //    if(end&&end.isValid()){
  //        var endMarker = gantt.addMarker({start_date: end.toDate(), css: "end", title: "Project due time"});
  //    }
  //};
  //initProjectMarker();

//##################################################################################
  gantt.attachEvent("onLinkClick", function (id, mouseEvent) {
    if (!gantt.config.drag_links) return;
    ysy.log.debug("LinkClick on " + id, "link_config");
    var link = gantt.getLink(id);
    if (gantt._is_readonly(link)) return;

    var linkConfigWidget = new ysy.view.LinkPopup().init(link.widget.model, link);
    linkConfigWidget.$target = $("#ajax-modal");//$dialog;
    linkConfigWidget.repaint();
    showModal("ajax-modal", "auto");
    return false;
  });
  gantt.attachEvent("onAfterLinkDelete", function (id, elem) {
    if (elem.deleted) return;
    if (!elem.widget.model._deleted) {
      elem.widget.model.remove();
    }
  });
  gantt.attachEvent("onBeforeLinkAdd", function (id, link) {
    if (link.widget) return true;
    var relations = ysy.data.relations;
    var data;
    data = {
      id: id,
      source_id: parseInt(link.source),
      target_id: parseInt(link.target),
      delay: 0,
      permissions: {
        editable: true
      },
      type: link.type
    };
    var relArray = relations.getArray();
    for (var i = 0; i < relArray.length; i++) {
      var relation = relArray[i];
      if (relation.source_id === data.source_id && relation.target_id === data.target_id) {
        dhtmlx.message(ysy.view.getLabel("errors2", "duplicate_link"), "error");
        return false;
      }
    }
    var rel = new ysy.data.Relation();
    rel.init(data, relations);
    //rel.delay=rel.getActDelay();  // created link have maximal delay
    ysy.history.openBrack();
    relations.push(rel);
    var res = rel.pushTarget();
    ysy.history.closeBrack();
    if (!res) {
      ysy.history.revert();
      dhtmlx.message(ysy.view.getLabel("errors2", "loop_link"), "error");
    }
    return false;
  });

  var taskTooltipInit = function () {
    var timeout = null;
    var $tooltip = null;
    gantt.taskTooltip = function (event) {
      $tooltip.show();
      var task = gantt.getTask(gantt.locate(event));
      var taskPos = $(event.target).offset();
      var model = task.widget.model;
      toolTipWidget.init(model, task);
      toolTipWidget.repaint(true);
      $tooltip.offset({left: event.pageX, top: taskPos.top + gantt.config.row_height});
    };
    var toolTipWidget = new ysy.view.TaskTooltip();
    $tooltip = $("<div>").attr("id", "gantt_task_tooltip").addClass("gantt-task-tooltip");
    var $content = $("#content");
    $content.append($tooltip);
    toolTipWidget.$target = $tooltip;
    $content
        .on("mouseenter", ".gantt_task_content, .gantt-task-tooltip-area", function (e) {
          ysy.log.debug("mouseenter", "tooltip");
          if (timeout) {
            clearTimeout(timeout);
          }
          //ysy.log.debug("e.which = "+e.which+" e.button = "+ e.button+" e.buttons = "+ e.buttons);
          if (e.buttons !== 0) return;
          timeout = setTimeout(gantt.taskTooltip(e), 500);
        })
        .on("mouseleave mousedown", ".gantt_task_content, .gantt-task-tooltip-area", function (e) {
          ysy.log.debug("mouseout", "tooltip");
          if (timeout) {
            clearTimeout(timeout);
          }
          if ($tooltip) {
            $tooltip.hide();
          }
        })
        .on("mouseup", function (e) {
          ysy.log.debug("mouseup", "tooltip");
          if (timeout) {
            clearTimeout(timeout);
          }
          if ($tooltip) {
            $tooltip.hide();
          }
        });

  };
  taskTooltipInit();

  dhtmlx.message = function (msg, type, delay) {
    if (!type) {
      type = msg.type;
      msg = msg.text;
      delay = msg.delay;
    }
    window.showFlashMessage(type, msg, delay && delay > 0 ? delay : undefined);
    //if (type !== "notice") {
    //  var flashElement = $("#content").children(".flash")[0];
    //  var adjust = -10;
    //  if (ysy.settings.easyRedmine) {
    //    $(document).scrollTop(flashElement.offsetTop + adjust + "px");
    //    //window.scrollTo(".flash",adjust);
    //  } else {
    //    window.scrollTo(0, flashElement.offsetTop + adjust);
    //  }
    //}
  };

  if (!window.showFlashMessage) {
    window.showFlashMessage = function (type, message) {
      var $content = $("#content");
      $content.find(".flash").remove();
      var template = '<div class="flash {{type}}"><a href="javascript:void(0)" class="close-icon close_button" style="float:right"></a><span>{{{message}}}</span></div>';
      var closeFunction = function (event) {
        $(this)
            .closest('.flash')
            .fadeOut(500, function () {
              $(this).remove();
            })
      };
      var rendered = Mustache.render(template, {message: message, type: type});
      $content.prepend($(rendered));
      $content.find(".close_button").click(closeFunction);
    }
  }
  if (!dhtmlx.dragScroll) {
    dhtmlx.dragScroll = function () {
      var $background = $(".gantt_task_bg");
      if (!$background.hasClass("inited")) {
        $background.addClass("inited");
        var dnd = new dhtmlxDnD($background[0], {});
        var lastScroll = null;
        dnd.attachEvent("onDragStart", function () {
          lastScroll = gantt.getCachedScroll();
        });
        dnd.attachEvent("onDragMove", function () {
          var diff = dnd.getDiff();
          gantt.scrollTo(lastScroll.x - diff.x, undefined);
        });
      }
    };
  }
  gantt.attachEvent("onTaskOpened", function (id) {
    ysy.data.limits.openings[id] = true;
    var task = gantt._pull[id];
    if (!task || !task.widget) return true;
    var entity = task.widget.model;
    if (entity.needLoad) {
      entity.needLoad = false;
      ysy.data.loader.loadSubEntity(task.type, entity.id);
    }
  });
  gantt.attachEvent("onTaskClosed", function (id) {
    ysy.data.limits.openings[id] = false;
  });
  gantt.attachEvent("onTaskSelected", function (id) {
    var data = gantt._get_tasks_data();
    gantt._backgroundRenderer.render_items(data);
  });
  gantt.attachEvent("onTaskUnselected", function (id, ignore) {
    if (ignore) return;
    var data = gantt._get_tasks_data();
    gantt._backgroundRenderer.render_items(data);
  });
  gantt.attachEvent("onLinkValidation", function (link) {
    if (link.source.length > 12) return false;
    if (link.target.length > 12) return false;
    if (gantt.getTask(link.source).readonly) return false;
    return !gantt.getTask(link.target).readonly;

  });
  gantt.attachEvent("onAfterTaskMove", function (sid, parent, tindex) {
    this.open(parent);
    return true;
  });
  gantt._filter_task = function (id, task) {
    // commented out because pushing task out of bounds removed the task and its project
    //var min = null, max = null;
    if (task.type === "project" && ysy.data.limits.filter_delayed_projects) {
      if (task.progress === 1) return false;
      if (task.progress >= (moment() - task.start_date) / (task.end_date - task.start_date)) return false;
    }
    //if(this.config.start_date && this.config.end_date){
    //  min = this.config.start_date.valueOf();
    //  max = this.config.end_date.valueOf();
    //
    //  if(+task.start_date > max || +task.end_date < +min)
    //    return false;
    //}
    return true;
  };
  //var oldPosFromDate = gantt.posFromDate;
  //gantt.posFromDate = function(date){
  //  ysy.log.debug("old: "+oldPosFromDate.call(gantt,date)+" new: "+gantt.posFromDate2(date));
  //  return gantt.posFromDate2(date);
  //};
  gantt.posFromDate = function (date) {
    var scale = this._tasks;
    if (typeof date === "string") {
      date = moment(date);
    }

    var tdate = date.valueOf();
    var units = {
      day: 86400000, // 24 * 60 * 60 * 1000
      week: 604800000, // 7 * 24 * 60 * 60 * 1000
      //month: 2592000000  // 30 * 24 * 60 * 60 * 1000
      month: 2629800000  // 30.4375 * 24 * 60 * 60 * 1000
    };
    if (date._isEndDate) {
      tdate += units.day;
    }

    if (tdate <= this._min_date)
      return 0;

    if (tdate >= this._max_date)
      tdate = this._max_date.valueOf();


    var unitRatio = (tdate - scale.trace_x[0]) / units[scale.unit];
    var index = Math.floor(unitRatio);
    index = Math.min(scale.count - 1, Math.max(0, index));
    if (scale.unit !== "month" || scale.count === index + 1) {
      return scale.left[index] + scale.width[index] * (unitRatio - index);
    }
    while (index !== 0 && tdate < scale.trace_x[index]) index--;
    var restRatio = (tdate - scale.trace_x[index]) / (scale.trace_x[index + 1] - scale.trace_x[index]);
    return scale.left[index] + scale.width[index] * restRatio;
  };
  gantt.dateFromPos2 = function (x) {
    // TODO tasks ends
    var scale = this._tasks;
    if (x < 0 || x > scale.full_width || !scale.full_width) {
      scale.needRescale = true;
      ysy.log.debug("needRescale", "outer");
    }
    if (!scale.trace_x.length) {
      return 0;
    }
    var units = {
      day: 86400000, // 24 * 60 * 60 * 1000
      week: 604800000, // 7 * 24 * 60 * 60 * 1000
      //month: 2592000000  // 30 * 24 * 60 * 60 * 1000
      month: 2629800000  // 30.4375 * 24 * 60 * 60 * 1000
    };
    var unitRatio = x / (scale.full_width / scale.count);
    var index = Math.floor(unitRatio);
    index = Math.min(scale.count - 1, Math.max(0, index));
    if (scale.unit === "month" && index !== scale.count - 1) {
      units.month = scale.trace_x[index + 1] - scale.trace_x[index];
    }
    return gantt.date.Date(
        scale.trace_x[index].valueOf()
        + units[scale.unit]
        * (x - scale.left[index])
        / scale.width[index]);
  };
  var taskRenderer = gantt.config.type_renderers["task"] || gantt._task_default_render;
  gantt.config.type_renderers["task"] = function (task) {
    var $div = $(taskRenderer.call(gantt, task));
    if (gantt.hasChild(task.id) || $div.hasClass("parent")) {
      $div.addClass("gantt_parent_task-subtype");
      var $ticks = $("<div class='gantt_task_ticks'></div>");
      var width = $div.width();
      if (width < 20) {
        $ticks.css({borderLeftWidth: width / 2, borderRightWidth: width / 2});
      }
      $div.append($ticks);


    }
    return $div[0];
  };
  var progressRenderer = gantt._render_task_progress;
  gantt._render_task_progress = function (task, element, maxWidth) {
    var width = progressRenderer.call(this, task, element, maxWidth);
    if (task.type !== "project") return width;
    var pos = gantt.posFromDate(task.start_date);
    var todayPos = gantt.posFromDate(moment());
    if (task.progress < 1 && pos + width < todayPos && element.childNodes.length) {
      element.childNodes[0].className += " gantt-project-overdue";
    }
    return width;
  };
  $.extend(gantt.templates, {
    grid_folder: function (item) {
      /// = HAS CHILDREN
      if (this["grid_bullet_" + gantt._get_safe_type(item.type)]) {
        return this["grid_bullet_" + gantt._get_safe_type(item.type)](item, true);
      }
      // default fallback
      if (item.$open || gantt._get_safe_type(item.type) !== gantt.config.types.task) {
        return "<div class='gantt_tree_icon gantt_folder_" + (item.$open ? "open" : "closed") + "'></div>";
      } else {
        return "<div class='gantt_tree_icon'><div class='gantt_drag_handle gantt_subtask_arrow'></div></div>";
      }
    },
    grid_file: function (item) {
      // = HAS NO CHILDREN
      if (this["grid_bullet_" + gantt._get_safe_type(item.type)]) {
        return this["grid_bullet_" + gantt._get_safe_type(item.type)](item, false);
      }
      // default fallback
      if (gantt._get_safe_type(item.type) === gantt.config.types.task)
        return "<div class='gantt_tree_icon'><div class='gantt_drag_handle gantt_subtask_arrow'></div></div>";
      return "<div class='gantt_tree_icon gantt_folder_open'></div>";
    },
    grid_bullet_milestone: function (item, has_children) {
      var rearrangable = false;
      return "<div class='gantt_tree_icon " + (rearrangable ? "gantt_drag_handle" : "") + "'>" +
          "<div class='gantt-milestone-icon gantt-grid-milestone-bullet" + (rearrangable ? " gantt-bullet-hover-hide" : "") + "'></div></div>";
    },
    grid_bullet_project: function (item, has_children) {
      if (item.$open || !has_children) {
        return "<div class='gantt_tree_icon gantt_folder_open'></div>";
      } else {
        return "<div class='gantt_tree_icon gantt_folder_closed'></div>";
      }
    },
    grid_bullet_task: function (item, has_children) {
      if (has_children) {
        return "<div class='gantt_tree_icon gantt_drag_handle gantt_folder_" + (item.$open ? "open" : "closed") + "'></div>";
      } else {
        return "<div class='gantt_tree_icon'><div class='gantt_drag_handle gantt_subtask_arrow'></div></div>";
      }
    },
    superitem_after_text: function (item, has_children) {
      if (this["superitem_after_" + gantt._get_safe_type(item.type)]) {
        return this["superitem_after_" + gantt._get_safe_type(item.type)](item, has_children);
      }
      return "";
    }
  });
  gantt._default_task_date = function (item, parent_id) {
    return moment();
  };
  gantt.attachEvent("onScrollTo", function (x, y) {
    var renderer = gantt._backgroundRenderer;
    var needRender = renderer.isScrolledOut(x, y);
    if (needRender) {
      //ysy.log.debug("render_one_canvas on [" + x + "," + y + "]", "scrollRender");
      renderer.render_items();
    }
  });
  var ganttOffsetTop;
  $(document).on("scroll", function (e) {
    if (!ganttOffsetTop) {
      if (!gantt.$task) return;
      ganttOffsetTop = $(gantt.$task).offset().top;
    }
    var scroll = $(this).scrollTop();
    gantt.scrollTo(undefined, scroll - ganttOffsetTop);
  });
  gantt.showTask = function (id) {
    var el = this.getTaskNode(id);
    if (!el) return;
    var left = Math.max(el.offsetLeft - this.config.task_scroll_offset, 0);
    var top = $(el).offset().top - 200;
    $(window).scrollTop(top);
    this.scrollTo(left, top);
  };
  gantt.getScrollState = function () {
    if (!this.$task || !this.$task_data) return null;
    return {x: this.$task.scrollLeft, y: $(window).scrollTop()};
  };
};
