"""
split_dataset.py — Splits your raw Kaggle weather dataset into train/val/test folders.

Usage:
    python split_dataset.py --source ./raw_data --dest ./data

Your raw_data folder should look like:
    raw_data/
        dew/        (all dew images)
        fog/        (all fog images)
        frost/
        glaze/
        hail/
        lightning/
        rain/
        rainbow/
        rime/
        sandstorm/
        snow/

After running, you'll have:
    data/
        train/dew/  train/fog/  ... (80% of images)
        val/dew/    val/fog/    ... (10% of images)
        test/dew/   test/fog/   ... (10% of images)
"""

import os
import shutil
import random
import argparse

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.heic'}

def split_dataset(source_dir, dest_dir, train_ratio=0.8, val_ratio=0.1, seed=42):
    random.seed(seed)

    if not os.path.isdir(source_dir):
        print(f'ERROR: Source folder not found: {source_dir}')
        print('Make sure --source points to your unzipped Kaggle dataset folder.')
        return

    classes = [d for d in os.listdir(source_dir)
               if os.path.isdir(os.path.join(source_dir, d)) and not d.startswith('.')]

    if not classes:
        print(f'ERROR: No subfolders found in {source_dir}')
        print('Expected subfolders like: dew/, fog/, rain/, snow/, etc.')
        return

    print(f'Found {len(classes)} classes: {", ".join(sorted(classes))}\n')

    total_copied = 0

    for cls in sorted(classes):
        cls_path = os.path.join(source_dir, cls)
        images = [
            f for f in os.listdir(cls_path)
            if os.path.splitext(f)[1].lower() in IMAGE_EXTENSIONS
        ]

        if not images:
            print(f'  [{cls}] WARNING: no images found, skipping.')
            continue

        random.shuffle(images)
        n = len(images)
        n_train = int(n * train_ratio)
        n_val   = int(n * val_ratio)

        splits = {
            'train': images[:n_train],
            'val':   images[n_train:n_train + n_val],
            'test':  images[n_train + n_val:],
        }

        for split_name, files in splits.items():
            out_dir = os.path.join(dest_dir, split_name, cls)
            os.makedirs(out_dir, exist_ok=True)
            for fname in files:
                src = os.path.join(cls_path, fname)
                dst = os.path.join(out_dir, fname)
                shutil.copy2(src, dst)
            total_copied += len(files)

        print(f'  [{cls}] {n} images → train: {len(splits["train"])}  val: {len(splits["val"])}  test: {len(splits["test"])}')

    print(f'\nDone. {total_copied} images copied to {dest_dir}/')
    print('\nNext step:')
    print('  python train_model.py --data_dir ./data --epochs 30')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=str, required=True,
                        help='Path to your raw Kaggle dataset folder (has class subfolders inside)')
    parser.add_argument('--dest',   type=str, default='./data',
                        help='Where to write train/val/test folders (default: ./data)')
    args = parser.parse_args()
    split_dataset(args.source, args.dest)