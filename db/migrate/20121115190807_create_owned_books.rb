class CreateOwnedBooks < ActiveRecord::Migration
  def change
    create_table :owned_books do |t|

      t.timestamps
    end
  end
end
