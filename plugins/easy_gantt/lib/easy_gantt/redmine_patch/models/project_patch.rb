module EasyGantt
  module ProjectPatch

    def self.included(base)
      base.extend(ClassMethods)
      base.send(:include, InstanceMethods)

      # Patch is also applied before db:migrate so you cannot call
      # column_names on non-existed table
      if Project.table_exists? && Project.column_names.include?('easy_start_date') && Project.column_names.include?('easy_due_date')
        base.send(:include, DatesWithNativeColumns)
      end

      base.class_eval do
      end
    end

    module InstanceMethods

      def gantt_editable?(user=nil)
        user ||= User.current

        (user.allowed_to?(:edit_easy_gantt, self) ||
         user.allowed_to_globally?(:edit_global_easy_gantt)) &&
        user.allowed_to?(:edit_project, self)
      end

      def gantt_reschedule(days)
        transaction do
          all_issues = Issue.joins(:project).where(gantt_subprojects_conditions);
          all_issues.update_all("start_date = start_date + INTERVAL '#{days}' DAY," +
                                "due_date = due_date + INTERVAL '#{days}' DAY")

          all_versions = Version.joins(:project).where(gantt_subprojects_conditions).lock
          all_versions.update_all("effective_date = effective_date + INTERVAL '#{days}' DAY")

          Redmine::Hook.call_hook(:model_project_gantt_reschedule, project: project, days: days, all_issues: all_issues)
        end
      end

      # Weighted completed percent including subprojects
      def gantt_completed_percent
        i_table = Issue.table_name

        scope = Issue.where("#{i_table}.estimated_hours IS NOT NULL").
                      where("#{i_table}.estimated_hours > 0").
                      joins(:project).
                      where(gantt_subprojects_conditions)

        if scope.exists?
          sum = scope.select('(SUM(done_ratio / 100 * estimated_hours) / SUM(estimated_hours) * 100) AS sum_alias').reorder(nil).first
          return sum.sum_alias.to_f if sum
        end

        100.0
      end

      def gantt_start_date
        @gantt_start_date ||= [
          Issue.joins(:project).where(gantt_subprojects_conditions).minimum('start_date'),
          Version.joins(:project).where(gantt_subprojects_conditions).minimum('effective_date')
        ].compact.min
      end

      def gantt_due_date
        @gantt_due_date ||= [
          Issue.joins(:project).where(gantt_subprojects_conditions).maximum('due_date'),
          Version.joins(:project).where(gantt_subprojects_conditions).maximum('effective_date')
        ].compact.max
      end

      def gantt_subprojects_conditions
        p_table = Project.table_name
        "#{p_table}.status <> #{Project::STATUS_ARCHIVED} AND #{p_table}.lft >= #{lft} AND #{p_table}.rgt <= #{rgt}"
      end

    end

    module DatesWithNativeColumns

      def gantt_reschedule(days)
        if !EasySetting.value(:project_calculate_start_date) && easy_start_date
          update_column(:easy_start_date, easy_start_date + days.days)
        end

        if !EasySetting.value(:project_calculate_due_date) && easy_due_date
          update_column(:easy_due_date, easy_due_date + days.days)
        end

        super
      end

      def gantt_start_date
        if EasySetting.value(:project_calculate_start_date) || easy_start_date.nil?
          super
        else
          easy_start_date
        end
      end

      def gantt_due_date
        if EasySetting.value(:project_calculate_due_date) || easy_due_date.nil?
          super
        else
          easy_due_date
        end
      end

    end

    module ClassMethods

      def load_gantt_dates(projects)
        p_table = Project.table_name
        i_table = Issue.table_name
        v_table = Version.table_name

        joins_subprojects = "SELECT id FROM #{p_table} p2 WHERE p2.status <> 9 AND p2.lft >= #{p_table}.lft AND p2.rgt <= #{p_table}.rgt"

        data = Project.where(id: projects.map(&:id)).
                       joins("LEFT OUTER JOIN #{i_table} i ON i.project_id IN (#{joins_subprojects})").
                       joins("LEFT OUTER JOIN #{v_table} v ON v.project_id IN (#{joins_subprojects})").
                       group("#{p_table}.id").
                       pluck("#{p_table}.id, MIN(i.start_date), MIN(v.effective_date), MAX(i.due_date), MAX(v.effective_date)")
        data.each do |id, issue_min, version_min, issue_max, version_max|
          project = projects.find{|p| p.id == id}

          start = [issue_min, version_min].compact.min
          due = [issue_max, version_max].compact.max

          project.instance_variable_set :@gantt_start_date, start
          project.instance_variable_set :@gantt_due_date, due
        end
      end

    end

  end
end

RedmineExtensions::PatchManager.register_model_patch 'Project', 'EasyGantt::ProjectPatch'
