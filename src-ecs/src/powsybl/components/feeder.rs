use bevy::prelude::*;

use super::circular_buffer::CircularBuffer;

const CAPACITY: usize = 10;

#[derive(Component)]
pub struct Feeder {
    pub id: String,
    values: CircularBuffer,
}

impl Feeder {
    pub fn new(id: String) -> Self {
        let values = CircularBuffer::new(CAPACITY);

        Self { id, values }
    }

    pub fn update(&mut self, value: f64) {
        self.values.push(value);
    }

    pub fn values(&self) -> Vec<f64> {
        self.values.get_newest_values()
    }

    pub fn get_range(&self) -> (f64, f64) {
        self.values.get_range()
    }
}
