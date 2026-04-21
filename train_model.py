"""
train_model.py — Training script for Weather Condition Image Classifier
Model: EfficientNet-B0 (transfer learning)
Dataset: Kaggle Weather Dataset (11 classes, ~6,862 images)

Usage:
    python train_model.py --data_dir ./data --epochs 30 --batch_size 32

Expected data directory structure:
    data/
      train/
        dew/        fog/      frost/    glaze/    hail/
        lightning/  rain/     rainbow/  rime/     sandstorm/  snow/
      val/
        (same structure)
      test/
        (same structure)
"""

import os
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.models as models
import torchvision.transforms as transforms
from torch.utils.data import DataLoader, random_split
from torchvision.datasets import ImageFolder
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import json

# ── Constants ──────────────────────────────────────────────────────────────────

CLASS_NAMES = ['dew', 'fog', 'frost', 'glaze', 'hail',
               'lightning', 'rain', 'rainbow', 'rime', 'sandstorm', 'snow']
NUM_CLASSES = len(CLASS_NAMES)

CHECKPOINT_DIR = 'ml/checkpoints'
EXPORT_DIR     = 'ml/exports'
RESULTS_DIR    = 'ml/results'

for d in [CHECKPOINT_DIR, EXPORT_DIR, RESULTS_DIR]:
    os.makedirs(d, exist_ok=True)

# ── Transforms ─────────────────────────────────────────────────────────────────

TRAIN_TRANSFORM = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

VAL_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

# ── Model ──────────────────────────────────────────────────────────────────────

def build_model(num_classes: int, freeze_backbone: bool = False) -> nn.Module:
    """Load EfficientNet-B0 pretrained on ImageNet and replace classifier head."""
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)

    if freeze_backbone:
        for param in model.features.parameters():
            param.requires_grad = False

    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes),
    )
    return model

# ── Training loop ──────────────────────────────────────────────────────────────

def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss, correct, total = 0.0, 0, 0
    for inputs, labels in loader:
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * inputs.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += inputs.size(0)
    return total_loss / total, correct / total


def validate(model, loader, criterion, device):
    model.eval()
    total_loss, correct, total = 0.0, 0, 0
    all_preds, all_labels = [], []
    with torch.no_grad():
        for inputs, labels in loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            total_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += inputs.size(0)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    return total_loss / total, correct / total, all_labels, all_preds

# ── Helpers ────────────────────────────────────────────────────────────────────

def save_checkpoint(model, optimizer, epoch, val_acc, path):
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'val_acc': val_acc,
    }, path)
    print(f'  [✓] Checkpoint saved → {path}')


def plot_training_curves(history: dict):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(history['train_loss'], label='Train')
    axes[0].plot(history['val_loss'], label='Val')
    axes[0].set_title('Loss')
    axes[0].legend()

    axes[1].plot(history['train_acc'], label='Train')
    axes[1].plot(history['val_acc'], label='Val')
    axes[1].set_title('Accuracy')
    axes[1].legend()

    plt.tight_layout()
    path = os.path.join(RESULTS_DIR, 'training_curves.png')
    plt.savefig(path)
    plt.close()
    print(f'  [✓] Training curves saved → {path}')


def plot_confusion_matrix(labels, preds, class_names):
    cm = confusion_matrix(labels, preds)
    plt.figure(figsize=(11, 9))
    sns.heatmap(cm, annot=True, fmt='d', xticklabels=class_names, yticklabels=class_names, cmap='Blues')
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix')
    path = os.path.join(RESULTS_DIR, 'confusion_matrix.png')
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    print(f'  [✓] Confusion matrix saved → {path}')


def export_model(model, class_names):
    # State dict export
    weights_path = os.path.join(EXPORT_DIR, 'weather_classifier.pth')
    torch.save(model.state_dict(), weights_path)
    print(f'  [✓] Weights saved → {weights_path}')

    # TorchScript export (for mobile)
    try:
        model.eval()
        example = torch.rand(1, 3, 224, 224)
        traced = torch.jit.trace(model, example)
        script_path = os.path.join(EXPORT_DIR, 'weather_classifier_scripted.pt')
        traced.save(script_path)
        print(f'  [✓] TorchScript model saved → {script_path}')
    except Exception as e:
        print(f'  [!] TorchScript export failed: {e}')

    # Class names
    names_path = os.path.join(EXPORT_DIR, 'class_names.txt')
    with open(names_path, 'w') as f:
        for name in class_names:
            f.write(f'{name}\n')
    print(f'  [✓] Class names saved → {names_path}')

# ── Main ───────────────────────────────────────────────────────────────────────

def main(args):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'[INFO] Using device: {device}')

    # ── Data loading ──────────────────────────────────────────────────────────
    train_dir = os.path.join(args.data_dir, 'train')
    val_dir   = os.path.join(args.data_dir, 'val')
    test_dir  = os.path.join(args.data_dir, 'test')

    if not os.path.isdir(train_dir):
        raise FileNotFoundError(
            f'Training data not found at {train_dir}. '
            'Organize your dataset as data/train/<class>/, data/val/<class>/, data/test/<class>/.'
        )

    train_dataset = ImageFolder(root=train_dir, transform=TRAIN_TRANSFORM)
    val_dataset   = ImageFolder(root=val_dir,   transform=VAL_TRANSFORM)
    test_dataset  = ImageFolder(root=test_dir,  transform=VAL_TRANSFORM) if os.path.isdir(test_dir) else None

    print(f'[INFO] Train: {len(train_dataset)} | Val: {len(val_dataset)}', end='')
    if test_dataset:
        print(f' | Test: {len(test_dataset)}')
    else:
        print()

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True,  num_workers=4, pin_memory=True)
    val_loader   = DataLoader(val_dataset,   batch_size=args.batch_size, shuffle=False, num_workers=4, pin_memory=True)
    test_loader  = DataLoader(test_dataset,  batch_size=args.batch_size, shuffle=False, num_workers=4, pin_memory=True) if test_dataset else None

    # ── Model, loss, optimizer ────────────────────────────────────────────────
    model = build_model(NUM_CLASSES, freeze_backbone=False).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    # ── Training ──────────────────────────────────────────────────────────────
    best_val_acc = 0.0
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}

    print(f'\n[INFO] Starting training for {args.epochs} epochs...\n')
    for epoch in range(1, args.epochs + 1):
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, _, _ = validate(model, val_loader, criterion, device)
        scheduler.step()

        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)

        print(f'Epoch [{epoch:02d}/{args.epochs}]  '
              f'Train Loss: {train_loss:.4f}  Train Acc: {train_acc:.4f}  '
              f'Val Loss: {val_loss:.4f}  Val Acc: {val_acc:.4f}')

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            save_checkpoint(
                model, optimizer, epoch, val_acc,
                os.path.join(CHECKPOINT_DIR, 'best_checkpoint.pth')
            )

    print(f'\n[INFO] Best validation accuracy: {best_val_acc:.4f}')

    # ── Save training curves ──────────────────────────────────────────────────
    plot_training_curves(history)
    with open(os.path.join(RESULTS_DIR, 'history.json'), 'w') as f:
        json.dump(history, f, indent=2)

    # ── Final test evaluation ─────────────────────────────────────────────────
    if test_loader:
        print('\n[INFO] Running test set evaluation...')
        # Load best checkpoint for test eval
        checkpoint = torch.load(os.path.join(CHECKPOINT_DIR, 'best_checkpoint.pth'), map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        _, test_acc, test_labels, test_preds = validate(model, test_loader, criterion, device)

        print(f'Test Accuracy: {test_acc:.4f}\n')
        report = classification_report(test_labels, test_preds, target_names=CLASS_NAMES)
        print(report)

        with open(os.path.join(RESULTS_DIR, 'classification_report.txt'), 'w') as f:
            f.write(report)

        plot_confusion_matrix(test_labels, test_preds, CLASS_NAMES)

    # ── Export ────────────────────────────────────────────────────────────────
    print('\n[INFO] Exporting model...')
    export_model(model, CLASS_NAMES)
    print('\n[INFO] Training complete.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train Weather Classifier')
    parser.add_argument('--data_dir',   type=str,   default='data',  help='Root data directory')
    parser.add_argument('--epochs',     type=int,   default=30,      help='Number of training epochs')
    parser.add_argument('--batch_size', type=int,   default=32,      help='Batch size')
    parser.add_argument('--lr',         type=float, default=1e-4,    help='Learning rate')
    args = parser.parse_args()
    main(args)