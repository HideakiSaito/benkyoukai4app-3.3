module EasyGanttHelper

  def easy_gantt_js_button(text, options={})
    if text.is_a?(Symbol)
      text = l(text, :scope => [:easy_gantt, :button])
      options[:title] ||= l(text, :scope => [:easy_gantt, :title], :default => text)
    end
    options[:class] = "gantt-menu-button #{options[:class]}"
    options[:class] << ' button button-2' unless options.delete(:no_button)
    if (icon = options.delete(:icon))
      options[:class] << " icon #{icon}"
    end
    link_to(text, options[:url] || 'javascript:void(0)', options)
  end

  def easy_gantt_help_button(*args)
    options = args.extract_options!
    feature = args.shift
    text = args.shift

    options[:class] = "gantt-menu-help-button #{options[:class]}"
    options[:icon] ||= 'icon-help'
    options[:id] = 'button_' + feature.to_s + '_help'
    help_text = raw l(options.delete(:easy_text) ? :easy_text : :text, :scope => [:easy_gantt, :popup, feature])
    easy_gantt_js_button(text || '&#8203;'.html_safe, options) + %Q(
    <div id="#{feature}_help_modal" style="display:none">
      <h3 class="title">#{raw l(:heading, :scope => [:easy_gantt, :popup, feature]) }</h3>
      <p>#{help_text}</p>
     </div>
    ).html_safe
  end

  def api_render_versions(api, versions)
    return if versions.blank?

    api.array :versions do
      versions.each do |version|
        api.version do
          api.id version.id
          api.name version.name
          api.start_date version.effective_date
          api.project_id version.project_id
          api.permissions do
            api.editable version.gantt_editable?
          end
        end
      end
    end

  end

  def api_render_columns(api, query)
    api.array :columns do
      query.columns.each do |c|
        api.column do
          api.name c.name
          api.title c.caption
        end
      end
    end
  end

  def api_render_scheme(api, table)
    return unless table.column_names.include?('easy_color_scheme')

    col = table.arel_table[:easy_color_scheme]
    records = table.where(col.not_eq(nil).and(col.not_eq(''))).pluck(:id, :easy_color_scheme)

    api.array table.to_s do
      records.each do |id, scheme|
        api.entity do
          api.id id
          api.scheme scheme
        end
      end
    end
  end

  def api_render_holidays(api, startdt, enddt)
    wc = User.current.try(:current_working_time_calendar)
    return if wc.nil?

    api.array :holidays do
      startdt.upto(enddt) do |date|
        api.date date if wc.holiday?(date)
      end
    end

  end

  def api_render_projects(api, projects)
    api.array :projects do
      projects.each do |project|
        api.project do
          api.id project.id
          api.name project.name
          api.start_date project.gantt_start_date || Date.today
          api.due_date project.gantt_due_date || Date.today
          api.parent_id project.parent_id
          api.is_baseline project.try(:easy_baseline_for_id?)

          # Schema
          api.status_id project.status
          #api.is_planned !!project.try(:is_planned)
          api.priority_id 1

          api.permissions do
            api.editable project.gantt_editable?
          end

          if EasySetting.value(:easy_gantt_show_project_progress)
            api.done_ratio project.gantt_completed_percent
          end

        end
      end
    end
  end

end
