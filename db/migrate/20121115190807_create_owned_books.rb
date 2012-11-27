class CreateOwnedBooks < ActiveRecord::Migration
  def change
    create_table :current_books do |t|

      t.timestamps
    end
  end
end
